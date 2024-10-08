import { styled } from "@casablanca-css/styled";
import openProps from "open-props";
import { StyledLink } from "rakkasjs";

export const LinkWithBorder = styled(StyledLink)`
  display: block;
  text-align: center;
  font-size: ${openProps.fontSize4};
  color: ${openProps.pink4};
  background-color: ${openProps.gray0};
  border: 5px solid currentcolor;
  border-radius: ${openProps.radius4};
`;
