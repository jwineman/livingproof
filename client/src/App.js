import React, { Component } from "react";
import Web3 from "./services/web3";
import { Grommet, Anchor, Box, Button, Text } from "grommet";

import "./App.css";

class App extends Component {
  state = { accounts: [], web3: null, connectError: null, page: null };

  componentDidMount = async () => {
    try {
      const web3 = await Web3();

      this.setState({ web3 });
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
          <Button
            label="Button"
            label="Create Proof"
            onClick={() => this.setState({ page: "create" })}
          />
          <Button
            label="Button"
            label="Update Proof"
            onClick={() => this.setState({ page: "update" })}
          />
          <Button
            label="Button"
            label="Delete Proof"
            onClick={() => this.setState({ page: "delete" })}
          />
        </Box>
        <Box
          direction="row-responsive"
          justify="center"
          align="center"
          pad="xlarge"
          gap="medium"
        >
          <div>{this.state.page === null ? "Content" : this.state.page}</div>
        </Box>
      </Grommet>
    );
  }
}

export default App;
