import React, { Component } from "react";
import Web3 from "./services/web3";
import { Grommet, Anchor, Box, Button, Header, Text, Heading } from "grommet";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LivingProof from "./contracts/LivingProof.json";
import "./App.css";

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
  state = { web3: null, connectError: null, events: [] };

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

      instance.events.UpdatedProof({ fromBlock: 0 }, (error, result) => {
        console.log("updated", result);
        if (!error) {
          this.setState(state => {
            const newEvents = [...state.events];
            if (newEvents.find(e => e.txHash === result.transactionHash)) {
              return null;
            }
            newEvents.push({
              txHash: result.transactionHash,
              event: "updateProof",
              address: result.returnValues._proofAddress,
              blockNumber: result.blockNumber
            });
            console.log(newEvents);
            return {
              events: newEvents
            };
          });
        } else {
        }
      });

      instance.events.NewProof({ fromBlock: 0 }, (error, result) => {
        console.log("new", result);
        if (!error) {
          this.setState(state => {
            const newEvents = [...state.events];
            if (newEvents.find(e => e.txHash === result.transactionHash)) {
              return null;
            }
            newEvents.push({
              txHash: result.transactionHash,
              event: "newProof",
              address: result.returnValues._proofAddress,
              blockNumber: result.blockNumber
            });
            console.log(newEvents);
            return {
              events: newEvents
            };
          });
        } else {
        }
      });

      // const instance = new web3.eth.Contract(
      //   LivingProof.abi,
      //   "0x9254Ab5e4F2aE4cd7D341CA532412A7240e909d5" // deployedNetwork && deployedNetwork.address
      // );

      this.setState({ contract: instance, web3 });
    } catch (error) {
      console.error(error);
    }
  };

  render() {
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

    return (
      <Wrapper>
        {this.state.events
          .sort((a, b) => b.blockNumber - a.blockNumber)
          .map(event => {
            return (
              <div>
                {event.address} // {event.event}
              </div>
            );
          })}
      </Wrapper>
    );
  }
}

export default App;
