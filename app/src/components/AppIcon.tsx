import { forwardRef, type ComponentType, type ElementType } from 'react';
import { Box, type SvgIconProps } from '@mui/material';
import {
  Add, AddSquare, ArrowLeft, ArrowSwapHorizontal, ArrowUp2, BackSquare, Backward,
  Bank, Briefcase, Calendar, Card, CardPos, Category, Chart, CloseCircle, CloudRemove,
  Convert, Copy, Discover, Edit2, Export, Eye, EyeSlash, Filter, Home2, InfoCircle, Key,
  Logout, Minus, Moon, Note, Notification, NotificationBing, People, Profile2User, Receipt,
  SearchNormal1, Setting2, ShoppingCart, Sun, TickCircle, TickSquare, Timer1, Trash,
} from 'iconsax-react';

type IconsaxVariant = 'Linear' | 'Outline' | 'Broken' | 'Bold' | 'Bulk' | 'TwoTone';
type IconsaxComponent = ComponentType<{ color?: string; size?: string | number; variant?: IconsaxVariant }>;
type AppIconProps = SvgIconProps & { variant?: IconsaxVariant };

/** MUI-compatible Iconsax adapter. Use these exports instead of direct icon-library imports. */
function createAppIcon(Icon: IconsaxComponent) {
  const IconBox = Box as ElementType;
  return forwardRef<SVGSVGElement, AppIconProps>(function AppIcon({
    color = 'inherit',
    fontSize = 'medium',
    htmlColor,
    sx,
    variant = 'Linear',
    ...props
  }, ref) {
    const size = fontSize === 'small' ? 20 : fontSize === 'large' ? 35 : fontSize === 'inherit' ? '1em' : 24;
    return (
      <IconBox
        component={Icon as ElementType}
        ref={ref}
        variant={variant}
        color={htmlColor ?? color}
        size={size}
        sx={[{ display: 'block', flexShrink: 0, width: size, height: size }, ...(Array.isArray(sx) ? sx : [sx]) ]}
        {...props}
      />
    );
  });
}

export const AcUnitIcon = createAppIcon(CloudRemove);
export const AccountBalanceIcon = createAppIcon(Bank);
export const AddIcon = createAppIcon(Add);
export const AddHomeIcon = createAppIcon(AddSquare);
export const ArrowBackIcon = createAppIcon(ArrowLeft);
export const BackspaceIcon = createAppIcon(BackSquare);
export const BarChartIcon = createAppIcon(Chart);
export const CalendarMonthIcon = createAppIcon(Calendar);
export const CalendarTodayIcon = createAppIcon(Calendar);
export const CancelIcon = createAppIcon(CloseCircle);
export const CategoryIcon = createAppIcon(Category);
export const CheckIcon = createAppIcon(TickSquare);
export const CheckCircleIcon = createAppIcon(TickCircle);
export const CheckCircleOutlineIcon = createAppIcon(TickCircle);
export const CloseIcon = createAppIcon(CloseCircle);
export const CloudOffIcon = createAppIcon(CloudRemove);
export const ContentCopyIcon = createAppIcon(Copy);
export const CreditCardIcon = createAppIcon(Card);
export const DarkModeIcon = createAppIcon(Moon);
export const DashboardIcon = createAppIcon(Category);
export const DeleteIcon = createAppIcon(Trash);
export const DeleteOutlineIcon = createAppIcon(Trash);
export const EditIcon = createAppIcon(Edit2);
export const EventIcon = createAppIcon(Calendar);
export const ExpandLessIcon = createAppIcon(ArrowUp2);
export const ExploreIcon = createAppIcon(Discover);
export const GroupAddIcon = createAppIcon(People);
export const HistoryIcon = createAppIcon(Backward);
export const HomeIcon = createAppIcon(Home2);
export const HourglassEmptyIcon = createAppIcon(Timer1);
export const InfoOutlinedIcon = createAppIcon(InfoCircle);
export const IosShareIcon = createAppIcon(Export);
export const KeyIcon = createAppIcon(Key);
export const LightModeIcon = createAppIcon(Sun);
export const LogoutIcon = createAppIcon(Logout);
export const NotesIcon = createAppIcon(Note);
export const NotificationsIcon = createAppIcon(Notification);
export const NotificationsActiveIcon = createAppIcon(NotificationBing);
export const PaymentsIcon = createAppIcon(CardPos);
export const PieChartIcon = createAppIcon(Chart);
export const ReceiptLongIcon = createAppIcon(Receipt);
export const RemoveIcon = createAppIcon(Minus);
export const SavingsIcon = createAppIcon(Bank);
export const SearchIcon = createAppIcon(SearchNormal1);
export const SettingsBrightnessIcon = createAppIcon(Setting2);
export const ShoppingCartIcon = createAppIcon(ShoppingCart);
export const SwapHorizIcon = createAppIcon(ArrowSwapHorizontal);
export const SwitchAccountIcon = createAppIcon(Profile2User);
export const SyncAltIcon = createAppIcon(Convert);
export const TimerIcon = createAppIcon(Timer1);
export const TuneIcon = createAppIcon(Filter);
export const VisibilityIcon = createAppIcon(Eye);
export const VisibilityOffIcon = createAppIcon(EyeSlash);
export const WorkIcon = createAppIcon(Briefcase);
