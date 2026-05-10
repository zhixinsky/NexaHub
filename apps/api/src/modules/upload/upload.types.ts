export type UploadSuccessResponse = {
  success: true;
  data: {
    url: string;
    filename: string;
  };
};

export type UploadErrorResponse = {
  success: false;
  message: string;
};

