import { Minter } from './../target/types/minter';

import { Solver } from './../target/types/solver';


import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import * as assert from "assert";



const game = anchor.workspace.Solver as Program<Solver>;
const createNft =  anchor.workspace.Minter as Program<Minter>;

const connection = new Connection('http://localhost:8899', 'confirmed');
const provider = anchor.AnchorProvider.env();
anchor.setProvider(anchor.AnchorProvider.env());

let authority =Keypair.generate();
let compteurAccount = Keypair.generate();
let nftAccount = Keypair.generate();
let gamePDA = Keypair.generate().publicKey;

let bump:number;

const mapData = Buffer.from( [1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 1,
  1, 2, 0, 0, 0, 1,
  1, 0, 3, 0, 0, 1,
  1, 0, 0, 4, 0, 1,
  1, 1 ,1 ,1, 1, 1]); 
const width = 6;
const height = 6;


function displayMapData(mapData:ArrayBuffer) {
  console.log("Map data:");
  for (let i = 0; i < height; i++) {
    let line = "";
    for (let j = 0; j < width; j++) {
      line += mapData[i * width + j] + " ";
    }
    console.log(line.trim());
  }

}

function displayBestSoluce(directions:ArrayBuffer) {
  console.log("Best soluce:");
  let line = " "
  for (let i = 0; i < directions.byteLength; i++) {
    line  += directions[i]
    line += "-";
   }
   console.log(line);

}

async function walletInit() {

  const balance = await provider.connection.getBalance(gamePDA);
  nftAccount = Keypair.generate();
  const lamports = 10 * LAMPORTS_PER_SOL;
  authority =Keypair.generate();
  const tx = await connection.requestAirdrop(authority.publicKey, lamports);
  await connection.confirmTransaction(tx);
  
}

  describe("MinterNft", () => {
   
    it("Is created!", async () => {
      
      await walletInit();

      let tx =  await createNft.methods
      .initializeNftId()
      .accounts({
        nftIdCounter:compteurAccount.publicKey,
        user: authority.publicKey,
      })
      .signers([compteurAccount, authority])
      .rpc();

      console.log("initialisation ok");


      tx = await createNft.methods
      .createNft(width, height, mapData)
      .accounts({
            nftAccount: nftAccount.publicKey,
            nftIdCounter: compteurAccount.publicKey,
            user: provider.wallet.publicKey,
            
      })
      .signers([nftAccount])
      .rpc();
    
      console.log("creation du nft Ok");

    let nftAccountInfo = await createNft.account.nftAccount.fetch(nftAccount.publicKey);
    assert.equal(nftAccountInfo.owner.toString(), provider.wallet.publicKey.toString());
    assert.equal(nftAccountInfo.height, height);
    assert.equal(nftAccountInfo.width, width);
    assert.deepEqual(nftAccountInfo.data, mapData);
    displayMapData(nftAccountInfo.data);
    console.log("id= ", nftAccountInfo.id )

    /*
    await walletInit();
    tx = await program.rpc.createNft(width, height, mapData, {
          accounts: {
            nftAccount: nftAccount.publicKey,
            nftIdCounter: compteurAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
      },
      signers: [nftAccount],
    });

    nftAccountInfo = await program.account.nftAccount.fetch(nftAccount.publicKey);
    assert.equal(nftAccountInfo.owner.toString(), provider.wallet.publicKey.toString());
    assert.equal(nftAccountInfo.height, height);
    assert.equal(nftAccountInfo.width, width);
    assert.deepEqual(nftAccountInfo.data, mapData);
    // displayMapData(nftAccountInfo.data);
    console.log("id= ", nftAccountInfo.id )
    */
   






    //await walletInit();
    const id_nft = 2;
    //Création de la seed 
    const idBytes = new Uint8Array(new Uint32Array([id_nft]).buffer);
    const seeds = 
    Buffer.concat([
    Buffer.from('Game'), // 'Game' en bytes
    idBytes,              // id_nft en bytes
    ]);
   
    //Récupérzation de l'adresse du PDA associé à id_nft
    [gamePDA, bump] = await PublicKey.findProgramAddress(
      [seeds],
      game.programId
    );

    //Affichag des balance du signer et du PDA avant la demande de solve
    let balanceUser = await provider.connection.getBalance(authority.publicKey);
    let balancePda = await provider.connection.getBalance(gamePDA);
    console.log("BalancePDA", balancePda);
    console.log("BalanceUser", balanceUser)
      
     //Changement d'id du nft 
    tx = await game.rpc.setId(2, {
       accounts: {
         minterProgram : createNft.programId,
         nftAccount : nftAccount.publicKey,
       },
       
     });  

     nftAccountInfo = await createNft.account.nftAccount.fetch(nftAccount.publicKey);
     console.log("id= ", nftAccountInfo.id )
     console.log("chagement de l'id pour tester OK")
   


    //Demande de résolution d'une séquence de mouvement 
    const moveSequence = Buffer.from( [3,1,3, 2,1,2,3]);
    /*
    tx = await game.rpc.solve(nftAccountInfo.width, nftAccountInfo.height, id_nft, nftAccountInfo.data, moveSequence, {
      accounts: {
        game : gamePDA,
        signer: authority.publicKey,
        systemProgram: game.programId,
      },
      signers: [authority],
    }); */

    tx = await game.methods
    .solve(nftAccountInfo.width, nftAccountInfo.height, id_nft, nftAccountInfo.data, moveSequence)
    .accounts({
          game : gamePDA,
          signer: authority.publicKey,
         
          
    })
    .signers([authority])
    .rpc();

    //Affichage des éléments du PDA pour vérification 
    let updatedGame = await game.account.gameState.fetch(gamePDA);
    console.log("solved = ", updatedGame.solved)
    displayBestSoluce(updatedGame.bestSoluce);
    console.log("longueur best soluce=", updatedGame.bestSoluce.length);
    console.log("Pubkey best soluce", updatedGame.leader);
   
    // Affichage des balances arpès la résolution
    balancePda = await provider.connection.getBalance(gamePDA);
    balanceUser = await provider.connection.getBalance(authority.publicKey);
    console.log("Balance du PDA:", balancePda);
    console.log("Balance du user:", balanceUser);

   // await walletInit();
/*
    tx = await game.rpc.claim( {
      accounts: {
        game : gamePDA,
        signer: authority.publicKey,
        systemProgram: game.programId,
      },
      signers: [authority],
    }); 
*/
    tx = await game.methods
    .claim() 
    .accounts({
          game : gamePDA,
          signer: authority.publicKey,
         
          
    })
    .signers([authority])
    .rpc();
    
    balancePda = await provider.connection.getBalance(gamePDA);
    balanceUser = await provider.connection.getBalance(authority.publicKey);
    console.log("Balance du PDA:", balancePda);
    console.log("Balance du user:", balanceUser);
  
  });

 
    
});