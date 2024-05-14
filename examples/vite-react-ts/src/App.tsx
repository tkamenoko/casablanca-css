import { css } from "@casablanca/core";
import { styled } from "@casablanca/styled";
import openProps from "open-props";
import { type FC, useState } from "react";
import { Button } from "./Button";

const StyledButton = styled(Button)`
  display: block;
  border: 3px solid blue;
`;

const StyledPWithAdditionalProps = styled("p")<{
  borderColor: "red" | "green" | "blue";
}>`
  border: 3px solid ${(p) => p.borderColor};
`;

const StyledH1 = styled("h1")`
  font-size: ${openProps.fontSize6};
`;

const fontSize = css`
  font-size: 3rem;
`;

const ContainerDiv = styled("div")`
  display: grid;
  grid-template-columns: auto;
  justify-content: center;
  align-items: center;
  & > .${StyledPWithAdditionalProps} {
    text-align: center;
  }
`;

export const App: FC = () => {
  const [color, setColor] = useState<"red" | "green" | "blue">("red");
  return (
    <ContainerDiv>
      <StyledH1>Casablanca + React-TS</StyledH1>
      <p>Zero runtime CSS-in-JS for vite.</p>
      <StyledButton />
      <StyledPWithAdditionalProps borderColor={color}>
        Dynamic style
      </StyledPWithAdditionalProps>
      <button
        type="button"
        onClick={() =>
          setColor((prev) =>
            prev === "red" ? "blue" : prev === "blue" ? "green" : "red",
          )
        }
      >
        ChangeColor
      </button>
      <p className={fontSize}>Foobar</p>
    </ContainerDiv>
  );
};
