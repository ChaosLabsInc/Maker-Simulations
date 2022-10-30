
pragma solidity 0.6.12;


import "dss-exec-lib/DssExec.sol";
import "dss-exec-lib/DssAction.sol";

contract DssSpellAction is DssAction {
    // As Pause proxy calls this class with delegatecall the fields in this calls are saved in the proxy contract memory.
    // Therfore, we need to place/pad fields to keep the proxy fields. More can be read on delegatecall.
    address public placeholderProxyMemory =
        0x0000000000000000000000000000000000000000;
    address public psmAddress = 0x0000000000000000000000000000000000000000;
    uint256 public tin = 0;
    uint256 public tout = 0;

    string public constant override description =
        "Chaos Labs spell configuration psm";

    function officeHours() public override returns (bool) {
        return false;
    }

    function setValues(
        address _psmAddress,
        uint256 _tin,
        uint256 _tout
    ) public {
        psmAddress = _psmAddress;
        tin = _tin;
        tout = _tout;
    }

    function actions() public override {
        DssExecLib.setValue(psmAddress, "tin", tin);
        DssExecLib.setValue(psmAddress, "tout", tout);
    }
}

contract DssSpell is DssExec {
    constructor()
        public
        DssExec(block.timestamp + 30 days, address(new DssSpellAction())) {}
}
