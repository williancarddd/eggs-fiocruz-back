import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as FormData from 'form-data'
import { Readable } from 'stream';
import { ProcessExecutions } from 'src/process/entities/process-executions.entity';
import { Algorithms } from 'src/utils/algorithms';
import { EggsCountResponseAIType } from 'src/process/dto/response-create-process.dto';
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
    form.append('file', imageStream, 'imagem.jpg');
    form.append('algorithm', createEggsCountDto.algorithm);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post<EggsCountResponseAIType>(process.env.EGGS_SERVER as string, form, {
          headers: {
            ...form.getHeaders(),
          },
        })
      );
      return response.data;
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        throw new HttpException(error.response?.data, error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}
