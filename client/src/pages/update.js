import React, { useState } from "react";
import { Select, TextInput, Button } from "grommet";

export const Update = ({ onUpdate, type }) => {
  const [period, setPeriod] = React.useState(0);
  const [amount, setAmount] = React.useState(0);
  return (
    <>
      <div>Interval</div>
      <TextInput
        value={period}
        onChange={event => setPeriod(event.target.value)}
      />
      {type === "pinata" ? (
        <>
          <div>Amount</div>
          <TextInput
            value={amount}
            onChange={event => setPeriod(event.target.value)}
          />
        </>
      ) : null}
      <Button
        label="Update Living Proof"
        onClick={async () => {
          await onUpdate({
            type: type === "basic" ? 0 : 1,
            interval: Number(period),
            amount: type === "basic" ? 0 : amount // keep as string for toWei call
          });
          console.log("NUMBER GO UP");
        }}
      />
    </>
  );
};

export default Update;
