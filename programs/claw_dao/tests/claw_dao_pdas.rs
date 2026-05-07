use anchor_lang::prelude::Pubkey;

#[test]
fn derives_pdas_for_dao() {
    let program_id = Pubkey::new_unique();
    let wallet = Pubkey::new_unique();

    let (dao, _) = Pubkey::find_program_address(&[b"dao-config"], &program_id);
    let (treasury, _) = Pubkey::find_program_address(&[b"dao-treasury"], &program_id);
    let (member, _) =
        Pubkey::find_program_address(&[b"dao-member", dao.as_ref(), wallet.as_ref()], &program_id);
    let (proposal, _) = Pubkey::find_program_address(
        &[b"dao-proposal", dao.as_ref(), &1u64.to_le_bytes()],
        &program_id,
    );
    let (vote, _) =
        Pubkey::find_program_address(&[b"dao-vote", proposal.as_ref(), wallet.as_ref()], &program_id);
    let (discovery, _) =
        Pubkey::find_program_address(&[b"dao-discovery", proposal.as_ref()], &program_id);

    assert_ne!(dao, Pubkey::default());
    assert_ne!(treasury, Pubkey::default());
    assert_ne!(member, Pubkey::default());
    assert_ne!(proposal, Pubkey::default());
    assert_ne!(vote, Pubkey::default());
    assert_ne!(discovery, Pubkey::default());
}
