import React, { Component } from "react";
import Web3 from "./services/web3";
import { Grommet, Anchor, Box, Button, Header, Text, Heading } from "grommet";

import EthereumIdenticon from "ethereum-identicon";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LivingProof from "./contracts/LivingProof.json";
import "./App.css";
import Create from "./pages/create";
import Kill from "./pages/kill";
import Update from "./pages/update";

const Wrapper = ({ children, backgroundColor }) => {
  return (
    <Grommet
      plain
      style={{ backgroundColor: backgroundColor || "inherit", height: "100%" }}
    >
      <ToastContainer />
      {children}
    </Grommet>
  );
};

class App extends Component {
  state = { currentAccount: null, web3: null, connectError: null, page: null };

  componentDidMount = async () => {
    try {
      const web3 = await Web3();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = LivingProof.networks[networkId];
      const instance = new web3.eth.Contract(
        LivingProof.abi,
        deployedNetwork && deployedNetwork.address
      );

      const latestBlock = web3.eth.getBlock("latest");

      instance.events.NewProof(
        { fromBlock: latestBlock.number },
        (error, result) => {
          if (!error) {
            toast("created new proof", { type: "success" });
          } else {
            toast("unable to create", { type: "error" });
          }
        }
      );

      // const instance = new web3.eth.Contract(
      //   LivingProof.abi,
      //   "0x9254Ab5e4F2aE4cd7D341CA532412A7240e909d5" // deployedNetwork && deployedNetwork.address
      // );

      this.setState({ contract: instance, web3 });
    } catch (error) {
      console.error(error);
    }
  };

  getAmount = async address => {
    return new Promise((resolve, reject) => {
      this.state.web3.eth.getBalance(address, (error, result) => {
        if (error) {
          return reject(error);
        }

        return resolve(result);
      });
    });
  };

  disconnectAccounts = () => {
    this.setState({ currentAccount: null });
  };

  getAccounts = () => {
    return new Promise((resolve, reject) => {
      this.state.web3.eth.getAccounts(async (error, accounts) => {
        if (error) {
          return reject(error);
        }

        return resolve(accounts);
      });
    });
  };

  openMetaMask = async () => {
    try {
      let accounts = await this.getAccounts();

      if (!accounts || accounts.length === 0) {
        await this.state.web3.connect();
        accounts = await this.getAccounts();
      }

      if (accounts.length === 0) {
        return;
      }

      const account = accounts[0];
      const amount = await this.getAmount(account);
      const proofData = await this.checkIsProof(account);

      if (!proofData.success) {
        this.setState({
          connectError: null,
          currentAccount: {
            address: account,
            amount,
            proofData: {
              success: false
            },
            isKilled: false,
            isExpired: false
          }
        });
        return;
      }

      const latestBlock = await this.state.web3.eth.getBlock("latest");
      const isKilled = +proofData.status === 1;
      const isExpired =
        +proofData.updated + +proofData.interval < +latestBlock.number;

      this.setState({
        connectError: null,
        currentAccount: {
          address: account,
          amount,
          proofData,
          isKilled,
          isExpired
        }
      });
    } catch (e) {
      console.error(e);
      this.setState({
        connectError: {
          code: e.code,
          message: e.message
        }
      });
    }
  };

  checkIsProof = async addr => {
    const response = await this.state.contract.methods.getProof(addr).call();
    console.log(response);
    return response;
  };

  setupProof = async (addr, vals) => {
    const response = await this.checkIsProof(addr);
    if (response && response.success) {
      console.log("already have a proof");
      return;
    }

    return new Promise((resolve, reject) => {
      this.state.contract.methods.newProof(vals.type, vals.interval).send(
        {
          from: addr,
          value: this.state.web3.utils.toWei(vals.amount, "ether")
          // gas: 1000
        },
        (err, resp) => {
          if (err) {
            return reject(err);
          }

          console.log(resp);
          return resolve(resp);
        }
      );
    });
  };

  runCreation = async vals => {
    this.setState({ actionInProgress: true });
    try {
      const response = await this.setupProof(
        this.state.currentAccount.address,
        vals
      );

      const amount = await this.getAmount(this.state.currentAccount.address);
      const proofData = await this.checkIsProof(
        this.state.currentAccount.address
      );

      const latestBlock = await this.state.web3.eth.getBlock("latest");
      const isKilled = +proofData.status === 1;
      const isExpired =
        +proofData.updated + +proofData.interval < +latestBlock.number;

      this.setState(state => ({
        currentAccount: {
          proofData,
          amount,
          address: state.currentAccount.address,
          isKilled,
          isExpired
        }
      }));
    } catch (e) {
      toast("error confirming create proof", e);
      console.error(e);
    }

    this.setState({ actionInProgress: false });
  };

  updatePinata = async (addr, vals) => {
    return new Promise((resolve, reject) => {
      this.state.contract.methods
        .updatePinata(
          addr,
          vals.interval,
          this.state.web3.utils.fromAscii(vals.message)
        )
        .send(
          {
            from: addr,
            value: this.state.web3.utils.toWei(vals.amount, "ether")
            // gas: 1000
          },
          (err, resp) => {
            if (err) {
              return reject(err);
            }

            console.log(resp);
            return resolve(resp);
          }
        );
    });
  };

  updateProof = async (addr, vals) => {
    return new Promise((resolve, reject) => {
      this.state.contract.methods
        .updateProof(
          addr,
          vals.interval,
          this.state.web3.utils.fromAscii(vals.message)
        )
        .send(
          {
            from: addr,
            value: this.state.web3.utils.toWei(vals.amount, "ether")
            // gas: 1000
          },
          (err, resp) => {
            if (err) {
              return reject(err);
            }

            console.log(resp);
            return resolve(resp);
          }
        );
    });
  };

  killPinata = async address => {
    return new Promise((resolve, reject) => {
      this.state.contract.methods.killPinata(address).send(
        {
          from: this.state.currentAccount.address
        },
        (err, resp) => {
          if (err) {
            return reject(err);
          }

          console.log(resp);
          return resolve(resp);
        }
      );
    });
  };

  killProof = async address => {
    return new Promise((resolve, reject) => {
      this.state.contract.methods.killProof(address).send(
        {
          from: this.state.currentAccount.address
        },
        (err, resp) => {
          if (err) {
            return reject(err);
          }

          console.log(resp);
          return resolve(resp);
        }
      );
    });
  };

  runUpdate = async vals => {
    this.setState({ actionInProgress: true });
    try {
      if (+this.state.currentAccount.proofData.proofType === 1) {
        await this.updatePinata(this.state.currentAccount.address, vals);
      } else {
        await this.updateProof(this.state.currentAccount.address, vals);
      }

      const amount = await this.getAmount(this.state.currentAccount.address);
      const proofData = await this.checkIsProof(
        this.state.currentAccount.address
      );

      toast("proof updated!", { type: "success" });

      const latestBlock = await this.state.web3.eth.getBlock("latest");
      const isKilled = +proofData.status === 1;
      const isExpired =
        +proofData.updated + +proofData.interval < +latestBlock.number;

      this.setState(state => ({
        page: null,
        currentAccount: {
          proofData,
          amount,
          address: state.currentAccount.address,
          isKilled,
          isExpired
        }
      }));
    } catch (e) {
      toast("error updating proof", e);
      console.error(e);
    }

    this.setState({ actionInProgress: false });
  };

  getPage = page => {
    switch (page) {
      case "create":
        return (
          <Create
            address={this.state.currentAddress}
            onCreate={this.runCreation}
          />
        );
      case "update":
        return (
          <Update
            interval={this.state.currentAccount.proofData.interval}
            onUpdate={this.runUpdate}
            type={
              +this.state.currentAccount.proofData.proofType === 1
                ? "pinata"
                : "basic"
            }
          />
        );
      case "kill":
        return (
          <Kill
            onKillProof={async () => {
              if (+this.state.currentAccount.proofType === 1) {
                await this.killPinata(this.state.currentAccount.address);
              } else {
                await this.killProof(this.state.currentAccount.address);
              }
              toast("proof was successfull killed", { type: "success" });
              setTimeout(() => {
                this.setState({ currentAccount: null, page: null });
              }, 2500);
            }}
            address={this.state.currentAccount.address}
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { actionInProgress } = this.state;

    if (!this.state.web3) {
      return (
        <Wrapper backgroundColor="#7D4CDB">
          <div style={{ height: "100%" }}>Loading...</div>
        </Wrapper>
      );
    }

    if (this.state.connectError) {
      return (
        <Wrapper backgroundColor="#7D4CDB">
          <Box
            direction="row-responsive"
            justify="center"
            align="center"
            pad="xlarge"
            gap="medium"
            style={{ height: "100%" }}
          >
            Metamask did not connect - {this.state.connectError.message}
          </Box>
        </Wrapper>
      );
    }

    if (!this.state.currentAccount) {
      return (
        <Wrapper backgroundColor="#7D4CDB">
          <Box
            direction="row-responsive"
            justify="center"
            align="center"
            pad="xlarge"
            gap="medium"
            style={{ height: "100%" }}
          >
            <Heading level={1}>Living Proof</Heading>
            <br />
            <br />
            <br />
            <br />
            <Button
              color="accent-1"
              primary
              label="Connect via Metamask"
              onClick={this.openMetaMask}
            />
          </Box>
        </Wrapper>
      );
    }

    const Avatar = ({ val }) => {
      return (
        <Box height="xxsmall" width="xxsmall" round="full">
          <EthereumIdenticon address={val} />
        </Box>
      );
    };

    console.log(this.state.currentAccount);

    return (
      <Wrapper>
        <Header background="brand" pad="small">
          <Avatar val={this.state.currentAccount.address} />
          <Box direction="row" gap="medium">
            {this.state.currentAccount.address}
            <span>
              (
              {this.state.web3.utils.fromWei(
                this.state.currentAccount.amount,
                "ether"
              )}
              )
            </span>
          </Box>
        </Header>
        {this.state.currentAccount.isKilled ? (
          <Header
            justify="center"
            align="center"
            background="status-critical"
            pad="small"
          >
            <Box direction="row" justify="center" align="center" gap="medium">
              <span style={{ fontSize: "25px", fontWeight: 600 }}>
                !! ☠️☠️ This proof is no longer living and this account is
                burned. 🔥🔥
              </span>
            </Box>
          </Header>
        ) : null}
        {this.state.currentAccount.isExpired ? (
          <Header
            justify="center"
            align="center"
            background="status-warning"
            pad="small"
          >
            <Box direction="row" justify="center" align="center" gap="medium">
              <span style={{ fontSize: "25px", fontWeight: 600 }}>
                !! ⏱⏱ This proof has expired....
              </span>
            </Box>
          </Header>
        ) : null}
        <Box
          direction="row-responsive"
          justify="center"
          align="center"
          pad="small"
          gap="medium"
        >
          <Heading level={1}>Living Proof</Heading>
        </Box>
        <Box
          direction="row-responsive"
          justify="center"
          align="center"
          gap="small"
        >
          <Box direction="column" justify="center" align="center" gap="small">
            {this.state.currentAccount.proofData.success ? (
              <>
                <Box
                  direction="column"
                  justify="center"
                  align="center"
                  pad="small"
                  gap="small"
                >
                  <h4>Address Proof</h4>
                  <div>
                    Proof Type:{" "}
                    {+this.state.currentAccount.proofData.proofType === 1
                      ? "Pinata"
                      : "Basic"}
                  </div>
                  <div>
                    Interval: {+this.state.currentAccount.proofData.interval}
                  </div>
                  <div>
                    Amount:{" "}
                    {this.state.web3.utils.fromWei(
                      this.state.currentAccount.proofData.amount,
                      "ether"
                    )}{" "}
                    ETH
                  </div>
                  <div>
                    Status:{" "}
                    {!this.state.currentAccount.isExpired &&
                    !this.state.currentAccount.isKilled
                      ? "Up"
                      : this.state.currentAccount.isKilled
                      ? "Killed ☠️☠️"
                      : this.state.currentAccount.isExpired
                      ? "Expired..."
                      : "Unknown"}
                  </div>
                  {this.state.currentAccount.proofData.message && (
                    <div>
                      Message:{" "}
                      {this.state.web3.utils.toAscii(
                        this.state.currentAccount.proofData.message
                      )}
                    </div>
                  )}
                </Box>
              </>
            ) : (
              <span>No Proof Configured</span>
            )}
            <Box
              direction="row-responsive"
              justify="center"
              align="center"
              pad="xlarge"
              gap="medium"
            >
              <Button
                label="Button"
                active={this.state.page === "create"}
                label="Create Proof"
                disabled={
                  actionInProgress ||
                  this.state.currentAccount.proofData.success ||
                  this.state.currentAccount.isKilled ||
                  this.state.currentAccount.isExpired
                }
                onClick={() => {
                  this.setState({ page: "create" });
                }}
              />
              <Button
                label="Button"
                active={this.state.page === "update"}
                label="Update Proof"
                disabled={
                  actionInProgress ||
                  !this.state.currentAccount.proofData.success ||
                  this.state.currentAccount.isKilled ||
                  this.state.currentAccount.isExpired
                }
                onClick={async () => {
                  this.setState({ page: "update" });
                }}
              />
              <Button
                label="Button"
                active={this.state.page === "kill"}
                label="Kill Proof"
                disabled={
                  actionInProgress ||
                  !this.state.currentAccount.proofData.success ||
                  this.state.currentAccount.isKilled
                }
                onClick={async () => {
                  this.setState({ page: "kill" });
                }}
              />
            </Box>
          </Box>
          <Box
            direction="row-responsive"
            justify="center"
            align="center"
            pad="xlarge"
            gap="medium"
          >
            <div>{this.getPage(this.state.page)}</div>
          </Box>
        </Box>
      </Wrapper>
    );
  }
}

export default App;
