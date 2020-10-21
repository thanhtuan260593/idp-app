import React from "react";
import cx from "classnames";
interface Props {
  extras?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}
export const Header = ({ extras, children, className }: Props) => {
  return (
    <div className={cx("flex flex-row mb-4 items-center h-6", className)}>
      <div className="flex-1 font-bold">{children}</div>
      {extras && <div className="flex flex-row">{extras}</div>}
    </div>
  );
};
