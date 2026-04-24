import { forwardRef } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";

const DropdownMenuTrigger = forwardRef(function DropdownMenuTrigger(props, ref) {
return <DropdownMenuPrimitive.Trigger ref={ref} data-slot="dropdown-menu-trigger" {...props} />;
});
export default DropdownMenuTrigger;
