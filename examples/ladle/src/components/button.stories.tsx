import type { Story } from "@ladle/react";
import { CustomButton, StyledButton } from "./button";

export const Buttons: Story = () => (
  <div>
    <StyledButton>Styled!</StyledButton>
    <CustomButton />
  </div>
);
