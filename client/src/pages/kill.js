import React, { useState } from "react";
import { Select, TextInput, Button } from "grommet";

export const Kill = ({ onKillProof, address }) => {
  const [addr, setAddr] = React.useState("");
  return (
    <>
      <Button
        label="Kill My Living Proof"
        onClick={() => onKillProof(address)}
      />
      <div>Address</div>
      <TextInput value={amount} onChange={event => setAddr(event)} />

      <Button
        label="Kill Living Proof"
        onClick={async () => {
          await onKill();
          console.log("NUMBER GO UP");
        }}
      />
    </>
  );
};

export default Kill;
