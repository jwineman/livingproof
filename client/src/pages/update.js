import React, { useState } from "react";
import { Select, TextArea, TextInput, Button } from "grommet";

export const Update = ({ interval, onUpdate, type }) => {
  const [period, setPeriod] = React.useState(interval);
  const [amount, setAmount] = React.useState(0);
  const [message, setMessage] = React.useState("");
  return (
    <>
      <div>Interval</div>
      <TextInput
        value={period}
        onChange={event => setPeriod(event.target.value)}
      />
      <div>Change Message</div>
      <TextArea
        value={message}
        onChange={event => setMessage(event.target.value)}
      />
      {type === "pinata" ? (
        <>
          <div>Amount</div>
          <TextInput
            value={amount}
            onChange={event => setAmount(event.target.value)}
          />
        </>
      ) : null}
      <Button
        label="Update Living Proof"
        onClick={async () => {
          await onUpdate({
            interval: Number(period),
            message,
            amount: type === "basic" ? "0" : amount.toString() // keep as string for toWei call
          });
          console.log("NUMBER GO UP");
        }}
      />
    </>
  );
};

export default Update;
