import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  public readonly code: string;
  public readonly fields?: Record<string, string>;

  constructor(
    code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    fields?: Record<string, string>,
  ) {
    super(
      {
        code,
        message,
        fields,
      },
      status,
    );
    this.code = code;
    this.fields = fields;
  }
}

