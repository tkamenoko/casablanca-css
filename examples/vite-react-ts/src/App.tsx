import { css } from "@casablanca/core";
import { styled } from "@casablanca/styled";
import openProps from "open-props";
import { type FC, useState } from "react";
import { Counter } from "./Counter";

const StyledCounter = styled(Counter)`
  background-color: ${openProps.gray0};
  color: ${openProps.teal4};
  font-size: ${openProps.fontSize6};
  border: ${openProps.borderSize3} solid ${openProps.indigo7};
  border-radius: ${openProps.radius3};
`;

const StyledPWithAdditionalProps = styled("p")<{
  borderColor: "red" | "green" | "blue";
}>`
  border: 3px solid ${openProps.indigo7};
  background-color: ${openProps.gray0};
  font-size: ${openProps.fontSize4};
  font-weight: ${openProps.fontWeight7};
  color: ${(p) => p.borderColor};
  text-align: center;
  border-radius: ${openProps.radius2};
  padding: .5rem 1rem;
`;

const StyledH1 = styled("h1")`
  padding: .5rem 1rem;
  background-color: ${openProps.gray0};
  color: ${openProps.red5};
  font-size: ${openProps.fontSize6};
  border: ${openProps.borderSize3} solid ${openProps.indigo7};
  border-radius: ${openProps.radius3};
`;
const CasablancaSpan = styled("span")`
  color: ${openProps.teal4};
`;
const ReactSpan = styled("span")`
  color: ${openProps.blue4};
`;

const description = css`
  font-size: ${openProps.fontSize4};
  font-weight: ${openProps.fontWeight7};
  color: ${openProps.gray1};
  text-align: center;
`;

const ColorChangeButton = styled("button")`
  background-color: ${openProps.gray0};
  font-size: ${openProps.fontSize4};
  border: ${openProps.borderSize3} solid ${openProps.indigo7};
  border-radius: ${openProps.radius3};
`;

const PanelDiv = styled("div")`
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 1rem;

  & > div{
    display: grid;
    row-gap: 3px;
  }
`;

const ContainerDiv = styled("div")`
  min-height: 100svh;
  display: grid;
  padding: .5rem 0;
  grid-template-columns: auto;
  row-gap: 5px;
  place-content: start center;
  background-image: ${openProps.gradient7};
`;

export const App: FC = () => {
  const [color, setColor] = useState<"red" | "green" | "blue">("red");
  return (
    <ContainerDiv>
      <StyledH1>
        <CasablancaSpan>Casablanca</CasablancaSpan>
        {" + "}
        <ReactSpan>React-TS</ReactSpan>
      </StyledH1>
      <p className={description}>Zero runtime CSS-in-JS for vite.</p>
      <PanelDiv>
        <StyledCounter />
        <div>
          <StyledPWithAdditionalProps borderColor={color}>
            Dynamic style
          </StyledPWithAdditionalProps>
          <ColorChangeButton
            type="button"
            onClick={() =>
              setColor((prev) => {
                switch (prev) {
                  case "red": {
                    return "green";
                  }
                  case "green": {
                    return "blue";
                  }
                  case "blue": {
                    return "red";
                  }
                  default: {
                    throw new Error("Unreachable");
                  }
                }
              })
            }
          >
            Change Color
          </ColorChangeButton>
        </div>
      </PanelDiv>
    </ContainerDiv>
  );
};
