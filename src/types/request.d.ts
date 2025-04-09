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
  isMinistry: boolean;
  ministryName: string;
  isChurch?: boolean;
  churchName?: string;
  requesterDepartmentId: number | undefined;
  locationOfUse: string;
  durationOfUse: string;
  dateOfReturn: string;
  descriptionOfRequest: string;
  //   items: [
  //     {
  //       storeId: number;
  //       itemId: number;
  //       quantityLeased: number;
  //     //   quantityLeased?: number;
  //       conditionBeforeLease: string;
  //     },
  //   ];
}
