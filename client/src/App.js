import React, { Component } from "react";
import Web3 from "./services/web3";
import { Grommet, Anchor, Box, Button, Header, Text, Heading } from "grommet";

import EthereumIdenticon from "ethereum-identicon";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LivingProof from "./contracts/LivingProof.json";
import "./App.css";
import Create from "./pages/create";
import Check from "./pages/check";
import Update from "./pages/update";

class App extends Component {
  state = { accounts: [], web3: null, connectError: null, page: null };

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
    this.setState({ accounts: [] });
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

      const acctsWithAmountsWork = accounts.map(async acct => {
        const amount = await this.getAmount(acct);
        const proofData = await this.checkIsProof(acct);
        return {
          amount,
          acct,
          proofData
        };
      });

      const values = await Promise.all(acctsWithAmountsWork);

      this.setState({
        connectError: null,
        accounts,
        values
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
    return response;
  };

  getPage = page => {
    switch (page) {
      case "create":
        return <Create />;
      case "update":
        return <Update />;
      default:
        return <Create />;
    }
  };

  setupProof = async addr => {
    const response = await this.checkIsProof(addr);
    if (response && response.success) {
      console.log("already have a proof");
      return;
    }

    return new Promise((resolve, reject) => {
      this.state.contract.methods.newProof(0, 3, 0).send(
        {
          from: addr
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

  render() {
    const { actionInProgress } = this.state;

    if (!this.state.web3) {
      return <div>Loading...</div>;
    }

    if (this.state.connectError) {
      return (
        <Grommet>
          <Box
            direction="row-responsive"
            justify="center"
            align="center"
            pad="xlarge"
            gap="medium"
          >
            Metamask did not connect - {this.state.connectError.message}
          </Box>
        </Grommet>
      );
    }

    if (!this.state.accounts || this.state.accounts.length === 0) {
      return (
        <Grommet plain>
          <Box
            direction="row-responsive"
            justify="center"
            align="center"
            pad="xlarge"
            gap="medium"
          >
            <Button label="Connect via Metamask" onClick={this.openMetaMask} />
          </Box>
        </Grommet>
      );
    }

    const Avatar = ({ val }) => {
      console.log(val);
      return (
        <Box height="xxsmall" width="xxsmall" round="full">
          <EthereumIdenticon address={val} />
        </Box>
      );
    };

    return (
      <Grommet plain>
        <Header background="light-4" pad="small">
          <Avatar val={this.state.values[0].acct} />
          <Box direction="row" gap="medium">
            {this.state.values[0].acct}
            <span>
              (
              {this.state.web3.utils.fromWei(
                this.state.values[0].amount,
                "ether"
              )}
              )
            </span>
          </Box>
        </Header>
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
          <div>
            {this.state.values.map(values => {
              return (
                <>
                  <Box
                    direction="column"
                    justify="center"
                    align="center"
                    pad="small"
                    gap="small"
                  >
                    <div>
                      {values.proofData.success ? (
                        <>
                          <h4>Address Proof</h4>
                          <div>Proof Type: {values.proofData.proofType}</div>
                          <div>Interval: {values.proofData.interval}</div>
                          <div>Amount: {values.proofData.amount}</div>
                          <div>Status: {values.proofData.status}</div>
                        </>
                      ) : (
                        <span>No Proof Configured</span>
                      )}
                    </div>
                  </Box>
                  <Box
                    direction="row-responsive"
                    justify="center"
                    align="center"
                    pad="xlarge"
                    gap="medium"
                  >
                    <Button
                      label="Button"
                      label="Create Proof"
                      disabled={actionInProgress || values.proofData.success}
                      onClick={async () => {
                        this.setState({ actionInProgress: true });
                        try {
                          const response = await this.setupProof(values.acct);

                          const acctsWithAmountsWork = this.state.accounts.map(
                            async acct => {
                              const amount = await this.getAmount(values.acct);
                              const proofData = await this.checkIsProof(
                                values.acct
                              );
                              return {
                                amount,
                                acct,
                                proofData
                              };
                            }
                          );

                          const newVals = await Promise.all(
                            acctsWithAmountsWork
                          );
                          this.setState({ values: newVals });
                        } catch (e) {
                          toast("error confirming create proof", e);
                          console.error(e);
                        }

                        this.setState({ actionInProgress: false });
                      }}
                    />
                    <Button
                      label="Button"
                      label="Update Proof"
                      disabled={actionInProgress || !values.proofData.success}
                      onClick={async () => {
                        this.setState({ page: "update" });
                      }}
                    />
                  </Box>
                </>
              );
            })}
          </div>
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
        <ToastContainer />
      </Grommet>
    );
  }
}

export default App;
