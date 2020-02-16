import React, { Component } from "react";
import Web3 from "./services/web3";
import { Grommet, Anchor, Box, Button, Header, Text, Heading } from "grommet";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import LivingProof from "./contracts/LivingProof.json";
import "./App.css";

import Styled from "styled-components";

const Badge = Styled.div`

  background-color: green;
  color: white;
  display: flex;
  width: 175px;
  justify-content: center;
  align-items: center;
  ${props =>
    props.isKilled &&
    `
  background-color: red;
  color: white;
  `}
`;

const Icon = Styled.div`
  height: 100%;
  background-color: grey;
  padding: 11px;
  flex: 0 0 30px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Right = Styled.div`
text-align: right;
flex: 1 1 100%;
`;

const TimeLeft = Styled.div`
padding: 0 7.5px 0 0;
  text-align: right;
  font-size: 20px;
`;

const Address = Styled.div`
  padding: 0 7.5px 0 0;
  text-align: right;

  font-family: Consolas;
  font-size: 15px;
`;

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

      const latestBlock = await web3.eth.getBlock("latest");

      instance.events.NewProof({ fromBlock: 0 }, async (error, result) => {
        console.log("new", result);
        if (error) {
          return;
        }
        //

        // const newEvents = [...this.state.events];
        // if (newEvents.find(e => e.txHash === result.transactionHash)) {
        //   return null;
        // }
        const response = await this.state.contract.methods
          .getProof(result.returnValues._proofAddress)
          .call();

        const latestBlock = await web3.eth.getBlock("latest");
        const isKilled =
          +response.status === 1 ||
          +response.updated + +response.interval < +latestBlock.number;

        console.log(response.updated, response.interval, latestBlock.number);

        const newEvent = {
          txHash: result.transactionHash,
          event: "newProof",
          address: result.returnValues._proofAddress,
          blockNumber: result.blockNumber,
          data: response,
          isKilled,
          currentBlockNumber: +latestBlock.number,
          blocksLeft:
            +response.updated + +response.interval - +latestBlock.number
        };

        this.setState(state => {
          const newEvents = [...state.events];
          newEvents.push(newEvent);
          return {
            events: newEvents
          };
        });
      });

      // const instance = new web3.eth.Contract(
      //   LivingProof.abi,
      //   "0x9254Ab5e4F2aE4cd7D341CA532412A7240e909d5" // deployedNetwork && deployedNetwork.address
      // );

      instance.events.UpdatedProof(
        { fromBlock: latestBlock.number },
        async (error, result) => {
          console.log("new", result);
          if (error) {
            return;
          }
          //

          // const newEvents = [...this.state.events];
          // if (newEvents.find(e => e.txHash === result.transactionHash)) {
          //   return null;
          // }
          const response = await this.state.contract.methods
            .getProof(result.returnValues._proofAddress)
            .call();

          const latestBlock = await web3.eth.getBlock("latest");
          const isKilled =
            +response.status === 1 ||
            +response.updated + +response.interval < +latestBlock.number;

          console.log(response.updated, response.interval, latestBlock.number);

          const newEvent = {
            txHash: result.transactionHash,
            event: "newProof",
            address: result.returnValues._proofAddress,
            blockNumber: result.blockNumber,
            data: response,
            isKilled,
            currentBlockNumber: +latestBlock.number,
            blocksLeft:
              +response.updated + +response.interval - +latestBlock.number
          };

          this.setState(state => {
            const newEvents = state.events.filter(
              e => e.address !== result.returnValues._proofAddress
            );
            newEvents.push(newEvent);
            return {
              events: newEvents
            };
          });
        }
      );

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
        <Box
          direction="column"
          justify="center"
          align="center"
          pad="xlarge"
          gap="medium"
        >
          {this.state.events
            .sort((a, b) => b.blockNumber - a.blockNumber)
            .map(event => {
              return (
                <Badge isKilled={event.isKilled}>
                  <Icon>
                    <svg
                      height="20px"
                      viewBox="0 -20 464 464"
                      width="20px"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="m340 0c-44.773438.00390625-86.066406 24.164062-108 63.199219-21.933594-39.035157-63.226562-63.19531275-108-63.199219-68.480469 0-124 63.519531-124 132 0 172 232 292 232 292s232-120 232-292c0-68.480469-55.519531-132-124-132zm0 0"
                        fill="#ff6243"
                      />
                      <path
                        d="m32 132c0-63.359375 47.550781-122.359375 108.894531-130.847656-5.597656-.769532-11.242187-1.15625025-16.894531-1.152344-68.480469 0-124 63.519531-124 132 0 172 232 292 232 292s6-3.113281 16-8.992188c-52.414062-30.824218-216-138.558593-216-283.007812zm0 0"
                        fill="#ff5023"
                      />
                    </svg>
                  </Icon>
                  <Right>
                    <TimeLeft>
                      {event.isKilled ? "Expired" : `${event.blocksLeft} Left`}
                    </TimeLeft>
                    <Address>{event.address.substring(0, 8)}</Address>
                  </Right>
                </Badge>
              );
            })}
        </Box>
      </Wrapper>
    );
  }
}

export default App;
