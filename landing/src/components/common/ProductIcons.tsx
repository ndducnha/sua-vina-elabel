import type { SVGProps } from 'react'
import {
  Barcode,
  Building2,
  ExternalLink,
  FileText,
  ImageIcon,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  Video,
} from 'lucide-react'

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
}

export function BarcodeIcon({ size = 16, ...props }: IconProps) {
  return <Barcode size={size} {...props} />
}

export function BuildingIcon({ size = 16, ...props }: IconProps) {
  return <Building2 size={size} {...props} />
}

export function ExternalLinkIcon({ size = 16, ...props }: IconProps) {
  return <ExternalLink size={size} {...props} />
}

export function FileTextIcon({ size = 16, ...props }: IconProps) {
  return <FileText size={size} {...props} />
}

export function ImageMediaIcon({ size = 16, ...props }: IconProps) {
  return <ImageIcon size={size} {...props} />
}

export function MailIcon({ size = 16, ...props }: IconProps) {
  return <Mail size={size} {...props} />
}

export function MapPinIcon({ size = 16, ...props }: IconProps) {
  return <MapPin size={size} {...props} />
}

export function PhoneIcon({ size = 16, ...props }: IconProps) {
  return <Phone size={size} {...props} />
}

export function ShieldCheckIcon({ size = 16, ...props }: IconProps) {
  return <ShieldCheck size={size} {...props} />
}

export function TagIcon({ size = 16, ...props }: IconProps) {
  return <Tag size={size} {...props} />
}

export function VideoIcon({ size = 16, ...props }: IconProps) {
  return <Video size={size} {...props} />
}