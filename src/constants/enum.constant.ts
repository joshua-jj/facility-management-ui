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
  // Multi-department parent computed state: at least one HOD approved
  // and at least one HOD declined. The parent is still assignable —
  // declined children are stripped from the assignee's view server-side.
  // See Multi-Department Requests Spec §4 (status machine).
  PARTIALLY_APPROVED = 'Partially Approved',
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
