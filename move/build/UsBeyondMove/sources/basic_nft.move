module us_beyond_move::basic_nft {
    use std::string::{Self, String};
    use std::signer;
    use aptos_token::token;
    use aptos_std::table::{Self, Table};

    const ENOT_AUTHORIZED: u64 = 1;
    const EALREADY_MINTED: u64 = 2;

    struct ModuleData has key {
        token_data_id: token::TokenDataId,
    }

    struct MintedRegistry has key {
        minted_names: Table<String, bool>,
    }

    public entry fun create_collection(
        sender: &signer,
        name: String,
        description: String,
        uri: String,
        maximum: u64,
    ) {
        token::create_collection(
            sender, 
            name, 
            description, 
            uri, 
            maximum, // maximum supply
            vector<bool>[false, false, false], // mutate_setting
        );
    }

    public entry fun mint_nft(
        sender: &signer,
        collection_name: String,
        name: String,
        description: String,
        uri: String,
    ) acquires MintedRegistry {
        let sender_addr = signer::address_of(sender);

        // 1. Initialize Registry if not exists
        if (!exists<MintedRegistry>(sender_addr)) {
            move_to(sender, MintedRegistry {
                minted_names: table::new()
            });
        };

        // 2. Check Uniqueness
        let registry = borrow_global_mut<MintedRegistry>(sender_addr);
        
        // Create a unique key for the registry: collection + name
        let key = copy collection_name;
        string::append(&mut key, string::utf8(b"::"));
        string::append(&mut key, copy name);

        assert!(!table::contains(&registry.minted_names, key), EALREADY_MINTED);
        table::add(&mut registry.minted_names, key, true);

        // 3. Create Token Data & Mint
        let token_data_id = token::create_tokendata(
            sender,
            collection_name,
            name,
            description,
            1, // STRICT LIMIT: Maximum 1 of this NFT
            uri,
            @us_beyond_move, // royalty payee address
            0, // royalty points denominator
            0, // royalty points numerator
            token::create_token_mutability_config(
                &vector<bool>[false, false, false, false, true]
            ),
            vector<String>[],
            vector<vector<u8>>[],
            vector<String>[],
        );

        token::mint_token(
            sender,
            token_data_id,
            1, // amount
        );
    }
}
