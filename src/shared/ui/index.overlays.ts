/**
 * Barrel for the overlay / navigation / feedback / data-display layer
 * (foundation package F8).
 *
 * INTEGRATOR NOTE: `src/shared/ui/index.ts` is owned by another agent, so this
 * file is kept separate. Add exactly one line to `index.ts`:
 *
 *     export * from "./index.overlays";
 */

/* overlays */
export { Modal, ModalRow, type ModalProps, type ModalSize } from "./modal";
export {
  ConfirmDialog,
  ConfirmDialogHost,
  confirmDialog,
  type ConfirmDialogOptions,
  type ConfirmDialogProps,
  type DialogTone,
} from "./dialog";
export { Sheet, type SheetProps, type SheetSize } from "./sheet";
export { Drawer, type DrawerProps } from "./drawer";
export {
  Popover,
  PopoverAnchor,
  PopoverClose,
  PopoverContent,
  PopoverRoot,
  PopoverTrigger,
  type PopoverProps,
} from "./popover";
export { Tooltip, TooltipProvider, type TooltipProps } from "./tooltip";
export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
  type DropdownMenuItemProps,
} from "./dropdown-menu";

/* navigation */
export {
  SegmentedControl,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  type SegmentedControlOption,
  type SegmentedControlProps,
  type TabsContentProps,
  type TabsListProps,
  type TabsProps,
  type TabsTriggerProps,
} from "./tabs";
export { Breadcrumbs, type BreadcrumbItem, type BreadcrumbsProps } from "./breadcrumbs";
export { Pagination, type PaginationProps } from "./pagination";
export { Accordion, type AccordionItem, type AccordionProps } from "./accordion";

/* display */
export { Chip, ChipGroup, type ChipGroupProps, type ChipOption, type ChipProps } from "./chip";
export { Tag, type TagProps } from "./tag";
export {
  Badge,
  CountBadge,
  StepPill,
  type BadgeProps,
  type BadgeTone,
  type CountBadgeProps,
  type StepPillProps,
} from "./badge";
export {
  Avatar,
  AvatarStack,
  type AvatarProps,
  type AvatarSize,
  type AvatarStackItem,
  type AvatarStackProps,
  type AvatarTone,
} from "./avatar";
export { Card, type CardProps, type CardRadius, type CardTone } from "./card";
export {
  Table,
  TableCellStack,
  type TableColumn,
  type TableEmphasis,
  type TableProps,
  type TableSort,
} from "./table";

/* feedback */
export {
  TOAST_DURATION,
  Toast,
  toast,
  useToastStore,
  type ToastAction,
  type ToastInput,
  type ToastProps,
  type ToastRecord,
  type ToastTone,
} from "./toast";
export { Toaster, type ToasterProps } from "./toaster";
export {
  SNACKBAR_DURATION,
  Snackbar,
  SnackbarHost,
  snackbar,
  type SnackbarHostProps,
  type SnackbarProps,
  type SnackbarRequest,
} from "./snackbar";
export { Banner, type BannerProps, type BannerTone } from "./banner";
export {
  Progress,
  ProgressRing,
  type ProgressProps,
  type ProgressRingProps,
  type ProgressTone,
} from "./progress";
export {
  Stepper,
  VerticalStepper,
  type StepState,
  type StepperProps,
  type StepperStep,
  type VerticalStepperProps,
  type VerticalStepperStep,
} from "./stepper";

/* lists & layout helpers */
export { InfiniteList, type InfiniteListProps } from "./infinite-list";
export { Grid, type GridProps, type ResponsiveValue } from "./grid";
export { PullToRefresh, type PullToRefreshProps } from "./pull-to-refresh";
