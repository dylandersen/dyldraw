import React from "react";

export const DyldrawLogoIcon = ({
  size = 18,
  rounded = true,
}: {
  size?: number;
  rounded?: boolean;
}) => {
  return (
    <img
      src="/dylDraw.png"
      alt="Dyldraw"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        objectFit: "cover",
        borderRadius: rounded ? 6 : 0,
      }}
    />
  );
};

export const DyldrawWelcomeLogo = () => {
  return (
    <img
      src="/dylDraw.png"
      alt="Dyldraw"
      style={{
        width: 96,
        height: 96,
        objectFit: "cover",
        borderRadius: 16,
      }}
    />
  );
};
