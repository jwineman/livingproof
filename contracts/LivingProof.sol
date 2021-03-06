pragma solidity >=0.4.21 <0.7.0;

contract LivingProof {
  event NewProof(address _proofAddress, uint _proofType);
  event KilledProof(address _proofAddress, uint _proofType);
  event UpdatedProof(address _proofAddress, uint _proofType);

  struct Proof {
    uint proofType; // type of proof, 0=basic, 1=pinata
    uint interval; // interval of renewal in number of blocks
    uint amount; // amount to be released if proofType=1 and status=1
    uint status; // current status of proof, 0=alive, 1=dead
    uint index; // index of the proof in the stored data
    uint updated; // block that the last proof was updated on
    address payable recipient; // recipient of the amount of a dead pinata proof
    bytes32 message; // optional message to include with latest proof state
  }

  mapping(address => Proof) public proofs; // proofs are mapped to the address of the creator
  address[] public proofIndex;

  // Check to see if a proof exists
  function isProof(address proofAddress)
    public
    view
    returns(bool)
  {
    if(proofIndex.length == 0) return false;
    return (proofIndex[proofs[proofAddress].index] == proofAddress);
  }

  // Get the details about an existing proof
  function getProof(address proofAddress)
    public
    view
    returns(
      bool success,
      uint proofType,
      uint interval,
      uint amount,
      uint status,
      uint index,
      uint updated,
      address recipient,
      bytes32 message
    )
  {
    success = isProof(proofAddress);
    proofType = proofs[proofAddress].proofType;
    interval = proofs[proofAddress].interval;
    amount = proofs[proofAddress].amount;
    status = proofs[proofAddress].status;
    index = proofs[proofAddress].index;
    updated = proofs[proofAddress].updated;
    recipient = proofs[proofAddress].recipient;
    message = proofs[proofAddress].message;
    return(
      success,
      proofType,
      interval,
      amount,
      status,
      index,
      updated,
      recipient,
      message
    );
  }

  // Create a new proof
  function newProof(uint proofType, uint interval)
    public
    payable
    returns(uint index, address proofAddress)
  {
    proofAddress = msg.sender;
    require(!isProof(proofAddress));
    proofs[proofAddress].proofType = proofType;
    proofs[proofAddress].interval = interval;
    proofs[proofAddress].amount = msg.value;
    proofs[proofAddress].status = 0;
    proofs[proofAddress].updated = block.number;
    proofs[proofAddress].index = proofIndex.push(proofAddress)-1;
    emit NewProof(proofAddress, proofType);
    return (proofIndex.length-1, proofAddress);
  }

  // Kill a basic proof as owner
  function killProof(address proofToKill)
    public
    returns(bool)
  {
    require(proofToKill == msg.sender);
    require(isProof(proofToKill));
    require(proofs[proofToKill].proofType == 0);
    proofs[proofToKill].status = 1;
    emit KilledProof(proofToKill, 0);
    return true;
  }

  // Kill a basic proof as anyone if the interval exceeds last updated block
  function killProofAnyone(address proofToKill)
    public
    returns(bool)
  {
    require(isProof(proofToKill));
    require(proofs[proofToKill].proofType == 0);
    if (proofs[proofToKill].updated + proofs[proofToKill].interval < block.number) {
      proofs[proofToKill].status = 1;
      emit KilledProof(proofToKill, 0);
      return true;
    }
    return false;
  }

  // Kill a pinata proof as owner
  // Returns pinata amount to the owner
  function killPinata(address payable proofToKill)
    public
    returns(bool)
  {
    require(proofToKill == msg.sender);
    require(isProof(proofToKill));
    require(proofs[proofToKill].proofType == 1);
    proofs[proofToKill].status = 1;
    uint amount = proofs[proofToKill].amount;
    proofs[proofToKill].amount = 0;
    proofToKill.transfer(amount);
    emit KilledProof(proofToKill, 1);
    return true;
  }

  // Kill a pinata proof as anyone if the interval exceeds last updated block
  function killPinataAnyone(address payable proofToKill)
    public
    returns(bool)
  {
    require(isProof(proofToKill));
    require(proofs[proofToKill].proofType == 1);
    if (proofs[proofToKill].updated + proofs[proofToKill].interval < block.number) {
      proofs[proofToKill].status = 1;
      uint amount = proofs[proofToKill].amount;
      proofs[proofToKill].amount = 0;
      proofs[proofToKill].recipient.transfer(amount);
      emit KilledProof(proofToKill, 1);
      return true;
    }
    return false;
  }

  // Update a basic proof as owner
  function updateProof(address proofToUpdate, uint interval, bytes32 message)
    public
    returns(bool)
  {
    require(proofToUpdate == msg.sender);
    require(isProof(proofToUpdate));
    proofs[proofToUpdate].interval = interval;
    proofs[proofToUpdate].message = message;
    proofs[proofToUpdate].updated = block.number;
    emit UpdatedProof(proofToUpdate, 0);
    return true;
  }

  // Update a pinata proof as owner
  function updatePinata(address proofToUpdate, uint interval, bytes32 message)
    public
    payable
    returns(bool)
  {
    require(proofToUpdate == msg.sender);
    require(isProof(proofToUpdate));
    proofs[proofToUpdate].interval = interval;
    proofs[proofToUpdate].message = message;
    proofs[proofToUpdate].updated = block.number;
    proofs[proofToUpdate].amount = proofs[proofToUpdate].amount + msg.value;
    emit UpdatedProof(proofToUpdate, 1);
    return true;
  }
}
