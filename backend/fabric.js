const fs = require('fs');
const path = require('path');
const os = require('os');
const grpc = require('@grpc/grpc-js');
const { connect, signers, hash } = require('@hyperledger/fabric-gateway');

const base = path.join(os.homedir(), 'fabric-samples/test-network');
const peer = 'peer0.org1.example.com';

const identities = {
  farmer: {
    mspId: 'Org1MSP',
    user: 'Admin@org1.example.com',
    org: 'org1.example.com'
  },
  distributor: {
    mspId: 'Org2MSP',
    user: 'User1@org2.example.com',
    org: 'org2.example.com'
  },
  retailer: {
    mspId: 'Org2MSP',
    user: 'User2@org2.example.com',
    org: 'org2.example.com'
  }
};

async function getContract(role) {
  const id = identities[role];
  if (!id) throw new Error('Invalid role');

  const userPath = path.join(
    base, 'organizations/peerOrganizations',
    id.org, 'users', id.user, 'msp'
  );

  const cert = fs.readFileSync(
    path.join(userPath, 'signcerts', fs.readdirSync(path.join(userPath, 'signcerts'))[0])
  );

  const keyDir = path.join(userPath, 'keystore');
  const privateKey = fs.readFileSync(
    path.join(keyDir, fs.readdirSync(keyDir)[0])
  );

  const tlsPath = path.join(
    base, 'organizations/peerOrganizations/org1.example.com/tlsca/tlsca.org1.example.com-cert.pem'
  );

  const client = new grpc.Client(
    'localhost:7051',
    grpc.credentials.createSsl(fs.readFileSync(tlsPath)),
    { 'grpc.ssl_target_name_override': peer }
  );

  const gateway = connect({
    client,
    identity: { mspId: id.mspId, credentials: cert },
    signer: signers.newPrivateKeySigner(require('crypto').createPrivateKey(privateKey)),
    hash: hash.sha256
  });

  return {
    contract: gateway.getNetwork('supplychannel').getContract('supplychain'),
    gateway,
    client
  };
}

module.exports = { getContract };
