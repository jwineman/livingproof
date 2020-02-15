import React, { useState } from "react";
import { Select, TextInput, Button } from "grommet";

export const Create = () => {
  const [type, setType] = React.useState("basic");
  const [period, setPeriod] = React.useState(0);
  const [amount, setAmount] = React.useState(0);
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
            onChange={event => setPeriod(event.target.value)}
          />
        </>
      ) : null}
      <Button
        label="Create Living Proof"
        onClick={() => console.log("NUMBER GO UP")}
      />
    </>
  );
};

export default Create;
