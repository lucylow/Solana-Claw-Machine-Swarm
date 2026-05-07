use anchor_lang::prelude::Pubkey;

#[test]
fn derives_expected_pdas() {
    let program_id = Pubkey::new_unique();
    let wallet = Pubkey::new_unique();

    let (config, _) = Pubkey::find_program_address(&[b"config"], &program_id);
    let (profile, _) = Pubkey::find_program_address(&[b"profile", wallet.as_ref()], &program_id);
    let (reputation, _) = Pubkey::find_program_address(&[b"reputation", profile.as_ref()], &program_id);
    let (memory, _) = Pubkey::find_program_address(&[b"memory", profile.as_ref(), b"turn_001"], &program_id);
    let (planner, _) = Pubkey::find_program_address(&[b"planner", profile.as_ref(), b"run_001"], &program_id);
    let (deployment, _) = Pubkey::find_program_address(&[b"deployment", profile.as_ref(), b"deploy_001"], &program_id);

    assert_ne!(config, Pubkey::default());
    assert_ne!(profile, Pubkey::default());
    assert_ne!(reputation, Pubkey::default());
    assert_ne!(memory, Pubkey::default());
    assert_ne!(planner, Pubkey::default());
    assert_ne!(deployment, Pubkey::default());
}
