export interface RequestConstants {
  REQUEST_CREATE_REQUEST: string;
  CREATE_REQUEST_SUCCESS: string;
  CREATE_REQUEST_ERROR: string;

  CREATE_REQUEST: string;

  REQUEST_URI: string;
}

export interface RequestForm {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  isMinistry: false;
  ministryName: string;
  isChurch: false;
  churchName: string;
  requesterDepartmentId: number;
  locationOfUse: string;
  durationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  items: [
    {
      storeId: number;
      itemId: number;
      quantityLeased: number;
      conditionBeforeLease: boolean;
      leasedDate: string;
    },
  ];
}
