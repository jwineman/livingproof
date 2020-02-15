import React, { Component } from "react";
import Web3 from "./services/web3";
import { Grommet, Anchor, Box, Button, Text, Heading } from "grommet";

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
        deployedNetwork && deployedNetwork.address,
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

      const acctsWithAmountsWork = accounts.map(async acct => {
        const amount = await this.getAmount(acct);
        return {
          amount,
          acct
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
    return await this.state.contract.methods.isProof(addr).call();
  };

  getPage = page => {
    switch (page) {
      case "create":
        return <Create />;
      case "update":
        return <Update />;
      case "check":
        return <Check />;
      default:
        return <Create />;
    }
  };

  setupProof = async addr => {
    const response = await this.checkIsProof(addr);
    if (response) {
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

    return (
      <Grommet plain>
        <Box
          direction="row-responsive"
          justify="center"
          align="center"
          pad="xlarge"
          gap="medium"
        >
          <Heading level={1}>Living Proof</Heading>
        </Box>
        {this.state.values.map(values => {
          return (
            <Box
              direction="row-responsive"
              justify="center"
              align="center"
              pad="xlarge"
              gap="medium"
            >
              {values.acct} (
              {this.state.web3.utils.fromWei(values.amount, "ether")})
              <Button
                label="Button"
                label="Create Proof"
                onClick={async () => {
                  await this.setupProof(values.acct);
                  this.setState({ page: "create" });
                }}
              />
              <Button
                label="Button"
                label="Update Proof"
                onClick={async () => {
                  this.setState({ page: "update" });
                }}
              />
              <Button
                label="Button"
                label="Check Proof"
                onClick={async () => {
                  const result = await this.checkIsProof(values.acct);
                  alert(result);
                  this.setState({ page: "check" });
                }}
              />
            </Box>
          );
        })}
        <Box
          direction="row-responsive"
          justify="center"
          align="center"
          pad="xlarge"
          gap="medium"
        >
          <div>{this.getPage(this.state.page)}</div>
        </Box>
      </Grommet>
    );
  }
}

export default App;
