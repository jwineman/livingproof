import React, { useState } from "react";
import { Select, TextInput, Button } from "grommet";

export const Create = ({ onCreate }) => {
  const [type, setType] = useState("basic");
  const [period, setPeriod] = useState(0);
  const [amount, setAmount] = useState(0);
  return (
    <>
      <div>Type:</div>
      <Select
        options={["basic", "pinata"]}
        value={type}
        onChange={({ option }) => setType(option)}
      />
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
            onChange={event => setAmount(event.target.value)}
          />
        </>
      ) : null}
      <Button
        label="Create Living Proof"
        onClick={async () => {
          await onCreate({
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

export default Create;
