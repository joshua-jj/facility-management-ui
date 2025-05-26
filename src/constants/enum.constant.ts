export enum RequestStatus {
  ASSIGNED = 'Assigned',
  NOT_ASSIGNED = 'Not Assigned',
  COMPLETED = 'Completed',
  COLLECTED = 'Collected',
  ACCEPTED = 'Accepted',
  APPROVED = 'Approved',
  DECLINED = 'Declined',
  CANCELLED = 'Cancelled',
  EXPIRED = 'Expired',
  DEFAULT = 'No Status',
  SUBMITTED = 'Submitted',
  PENDING = 'Pending',
}
export enum RequestType {
  MINISTRY = 'Ministry',
  CHURCH = 'Church',
  INDIVIDUAL = 'Individual',
  DEFAULT = 'No Type',
}
export enum RequestPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
  DEFAULT = 'No Priority',
}
export enum RequestCategory {
  EQUIPMENT = 'Equipment',
  VEHICLE = 'Vehicle',
  SUPPLIES = 'Supplies',
  DEFAULT = 'No Category',
}
export enum RequestItemStatus {
  AVAILABLE = 'Available',
  UNAVAILABLE = 'Unavailable',
  PENDING = 'Pending',
  APPROVED = 'Approved',
  DECLINED = 'Declined',
  CANCELLED = 'Cancelled',
  DEFAULT = 'No Status',
}
