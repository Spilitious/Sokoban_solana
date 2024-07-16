use anchor_lang::prelude::*;


use crate::soluce_checker::*;
mod soluce_checker;


declare_id!("G4Y4Zm1BPHTFUGkj8HXmNderHWHxiZDPK1wC3E5WbZhG");

#[program]
pub mod solver {
    use super::*;
 
    pub fn solve(ctx: Context<Initialize>, width:u8, height:u8, id_nft:u32,  map_data:Vec<u8>, directions: Vec<u8>) -> Result<()> {
        soluce_checker::solve(ctx, width, height, id_nft, map_data, directions)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        soluce_checker::claim(ctx)
    }

    /*
    pub fn set_id(ctx: Context<GetData>, id:u32) -> Result<()> {
        soluce_checker::set_id(ctx, id)
    }
*/
 
    pub fn read_other_data(ctx: Context<ReadOtherData>) -> Result<()> {
        soluce_checker::read_other_data(ctx)
    }
}