use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, Transfer},
    associated_token::AssociatedToken,
};

declare_id!("FutarchyGov11111111111111111111111111111");

#[program]
pub mod futarchy_gov {
    use super::*;

    /// Initialize a new futarchy market with YES/NO tokens
    pub fn create_market(
        ctx: Context<CreateMarket>,
        question: String,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.creator = ctx.accounts.creator.key();
        market.question = question;
        market.yes_mint = ctx.accounts.yes_mint.key();
        market.no_mint = ctx.accounts.no_mint.key();
        market.created_at = Clock::get()?.unix_timestamp;
        market.status = MarketStatus::Active;
        market.yes_reserve = 0;
        market.no_reserve = 0;
        
        Ok(())
    }

    /// Swap YES tokens for NO tokens or vice versa
    pub fn swap(
        ctx: Context<SwapWithParam>,
        input_amount: u64,
        min_output: u64,
        swapping_yes: bool, // true = swapping YES for NO, false = NO for YES
    ) -> Result<u64> {
        let market = &mut ctx.accounts.market;
        
        // Calculate output using constant product formula (x * y = k)
        let (input_reserve, output_reserve) = if swapping_yes {
            (market.yes_reserve, market.no_reserve)
        } else {
            (market.no_reserve, market.yes_reserve)
        };

        require!(input_reserve > 0 && output_reserve > 0, ErrorCode::InsufficientLiquidity);

        // Apply 0.3% fee (like Raydium)
        let fee = input_amount
            .checked_mul(3)
            .and_then(|x| x.checked_div(1000))
            .ok_or(ErrorCode::MathOverflow)?;
        
        let input_after_fee = input_amount.checked_sub(fee).ok_or(ErrorCode::MathOverflow)?;
        let new_input_reserve = input_reserve
            .checked_add(input_after_fee)
            .ok_or(ErrorCode::MathOverflow)?;
        
        // Constant product: k = input_reserve * output_reserve
        let k = input_reserve
            .checked_mul(output_reserve)
            .ok_or(ErrorCode::MathOverflow)?;
        
        let new_output_reserve = k
            .checked_div(new_input_reserve)
            .ok_or(ErrorCode::MathOverflow)?;
        
        let output_amount = output_reserve
            .checked_sub(new_output_reserve)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(output_amount >= min_output, ErrorCode::SlippageExceeded);

        // Update reserves
        if swapping_yes {
            market.yes_reserve = new_input_reserve;
            market.no_reserve = new_output_reserve;
        } else {
            market.no_reserve = new_input_reserve;
            market.yes_reserve = new_output_reserve;
        }

        // Transfer tokens
        if swapping_yes {
            // Transfer YES tokens from user to market
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_input_account.to_account_info(),
                        to: ctx.accounts.market_yes_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                input_amount,
            )?;

            // Transfer NO tokens from market to user
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.market_no_vault.to_account_info(),
                        to: ctx.accounts.user_output_account.to_account_info(),
                        authority: ctx.accounts.market_authority.to_account_info(),
                    },
                    &[&[b"market", market.key().as_ref(), &[ctx.bumps.market_authority]]],
                ),
                output_amount,
            )?;
        } else {
            // Transfer NO tokens from user to market
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.user_input_account.to_account_info(),
                        to: ctx.accounts.market_no_vault.to_account_info(),
                        authority: ctx.accounts.user.to_account_info(),
                    },
                ),
                input_amount,
            )?;

            // Transfer YES tokens from market to user
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.market_yes_vault.to_account_info(),
                        to: ctx.accounts.user_output_account.to_account_info(),
                        authority: ctx.accounts.market_authority.to_account_info(),
                    },
                    &[&[b"market", market.key().as_ref(), &[ctx.bumps.market_authority]]],
                ),
                output_amount,
            )?;
        }

        Ok(output_amount)
    }

    /// Add liquidity to the market
    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        yes_amount: u64,
        no_amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        // Transfer tokens to market vaults
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_yes_account.to_account_info(),
                    to: ctx.accounts.market_yes_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            yes_amount,
        )?;

        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_no_account.to_account_info(),
                    to: ctx.accounts.market_no_vault.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            no_amount,
        )?;

        // Update reserves
        market.yes_reserve = market.yes_reserve
            .checked_add(yes_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        market.no_reserve = market.no_reserve
            .checked_add(no_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        Ok(())
    }

    /// Remove liquidity from the market
    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        yes_amount: u64,
        no_amount: u64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        require!(
            market.yes_reserve >= yes_amount && market.no_reserve >= no_amount,
            ErrorCode::InsufficientLiquidity
        );

        // Update reserves
        market.yes_reserve = market.yes_reserve
            .checked_sub(yes_amount)
            .ok_or(ErrorCode::MathOverflow)?;
        market.no_reserve = market.no_reserve
            .checked_sub(no_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        // Transfer tokens back to user
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.market_yes_vault.to_account_info(),
                    to: ctx.accounts.user_yes_account.to_account_info(),
                    authority: ctx.accounts.market_authority.to_account_info(),
                },
                &[&[b"market", market.key().as_ref(), &[ctx.bumps.market_authority]]],
            ),
            yes_amount,
        )?;

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.market_no_vault.to_account_info(),
                    to: ctx.accounts.user_no_account.to_account_info(),
                    authority: ctx.accounts.market_authority.to_account_info(),
                },
                &[&[b"market", market.key().as_ref(), &[ctx.bumps.market_authority]]],
            ),
            no_amount,
        )?;

        Ok(())
    }

    /// Resolve the market (set outcome)
    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome: bool, // true = YES won, false = NO won
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(
            market.status == MarketStatus::Active,
            ErrorCode::MarketNotActive
        );

        market.status = if outcome {
            MarketStatus::ResolvedYes
        } else {
            MarketStatus::ResolvedNo
        };
        market.resolved_at = Some(Clock::get()?.unix_timestamp);

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMarket<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Market::LEN,
        seeds = [b"market", creator.key().as_ref(), question.as_bytes()],
        bump
    )]
    pub market: Account<'info, Market>,

    /// CHECK: Market authority PDA
    #[account(
        seeds = [b"market", market.key().as_ref()],
        bump
    )]
    pub market_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub yes_mint: Account<'info, Mint>,
    pub no_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = creator,
        token::mint = yes_mint,
        token::authority = market_authority,
        seeds = [b"vault", market.key().as_ref(), b"yes"],
        bump
    )]
    pub market_yes_vault: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = creator,
        token::mint = no_mint,
        token::authority = market_authority,
        seeds = [b"vault", market.key().as_ref(), b"no"],
        bump
    )]
    pub market_no_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(swapping_yes: bool)]
pub struct SwapWithParam<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    /// CHECK: Market authority PDA
    #[account(
        seeds = [b"market", market.key().as_ref()],
        bump
    )]
    pub market_authority: UncheckedAccount<'info>,

    pub user: Signer<'info>,

    #[account(mut)]
    pub user_input_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_output_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_yes_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_no_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    /// CHECK: Market authority PDA
    #[account(
        seeds = [b"market", market.key().as_ref()],
        bump
    )]
    pub market_authority: UncheckedAccount<'info>,

    pub user: Signer<'info>,

    #[account(mut)]
    pub user_yes_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_no_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_yes_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_no_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    /// CHECK: Market authority PDA
    #[account(
        seeds = [b"market", market.key().as_ref()],
        bump
    )]
    pub market_authority: UncheckedAccount<'info>,

    pub user: Signer<'info>,

    #[account(mut)]
    pub user_yes_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_no_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_yes_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub market_no_vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,

    pub resolver: Signer<'info>, // Could add permission checks here
}

#[account]
pub struct Market {
    pub creator: Pubkey,
    pub question: String,
    pub yes_mint: Pubkey,
    pub no_mint: Pubkey,
    pub yes_reserve: u64,
    pub no_reserve: u64,
    pub created_at: i64,
    pub resolved_at: Option<i64>,
    pub status: MarketStatus,
}

impl Market {
    pub const LEN: usize = 
        32 + // creator
        4 + 512 + // question (max 512 chars)
        32 + // yes_mint
        32 + // no_mint
        8 + // yes_reserve
        8 + // no_reserve
        8 + // created_at
        1 + 8 + // resolved_at (Option<i64>)
        1; // status
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Active,
    ResolvedYes,
    ResolvedNo,
    Cancelled,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient liquidity in the pool")]
    InsufficientLiquidity,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Market is not active")]
    MarketNotActive,
}

