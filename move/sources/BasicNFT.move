module us_beyond_move::basic_nft {
    use std::string::{Self, String};
    use std::signer;
    use aptos_token::token;

    struct ModuleData has key {
        token_data_id: token::TokenDataId,
    }

    const ENOT_AUTHORIZED: u64 = 1;

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
    ) {
        let token_data_id = token::create_tokendata(
            sender,
            collection_name,
            name,
            description,
            0, // maximum for this token data
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
