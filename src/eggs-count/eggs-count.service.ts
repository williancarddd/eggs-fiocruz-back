import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data'
import { Readable } from 'stream';
import { Algorithms } from 'src/utils/algorithms';
import { EggsCountResponseAIType } from 'src/process/dto/response-api-ai.dto';
import { AxiosError } from 'axios';

@Injectable()
export class EggsCountService {
  constructor(private readonly httpService: HttpService) { }

  async create(createEggsCountDto: {
    image: Buffer | Readable;
    algorithm: Algorithms;
  }) {

    // Garante que form-data seja instanciado corretamente
    const form = new FormData();

    // Converte Buffer para Readable se necessário
    const imageStream = Buffer.isBuffer(createEggsCountDto.image)
      ? Readable.from(createEggsCountDto.image)
      : createEggsCountDto.image;

    // Adiciona o arquivo ao FormData
    form.append('file', imageStream, { filename: 'image.jpg' }); // Specify filename

    form.append('algorithm', createEggsCountDto.algorithm);

    try {
      console.log('process.env.EGGS_SERVER', process.env.EGGS_SERVER);
      const response = await firstValueFrom(
        this.httpService.post<EggsCountResponseAIType>(process.env.EGGS_SERVER as string, form, {
          headers: {
            ...form.getHeaders(),
          },
        })
      );
      console.log('response.data', response.data);
      return response.data;
    } catch (error) {
      // console message error

      console.log('error in eggs-count.service.ts', error);

      if (error instanceof AxiosError) {
        throw new HttpException(error.response?.data, error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
