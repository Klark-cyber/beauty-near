import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger: Logger = new Logger(); //Kiruvchi va chiquvchi malumotlarni terminalda korinib turadigan qilamiz

  public intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const recordTime = Date.now();
    const requestType = context.getType<GqlContextType>(); //response HTTP yoki GraphQl ekanligini tekshiramiz
    console.log("STEP-3")
    if(requestType === 'http'){
      // Develop if needed!
    } else if(requestType === 'graphql'){

      /** (1) Print Request */
      const gqlContext = GqlExecutionContext.create(context);
      this.logger.log(`${this.stringify(gqlContext.getContext().req.body)}`, 'REQUEST');

      /** (2) Errors handing via GraphQL */

      /** (3) No Errors, giving Response below */
      return next.handle().pipe(
        tap((context) => { //bu yerdagi context responsedan kelayotgan context
          console.log("STEP-7")
          const responseTime = Date.now() - recordTime;
          this.logger.log(`${this.stringify(context)} - ${responseTime}ms \n\n`, 'RESPONSE');
        }), //res vaqti va datasi chop etiladi
      );
    }

    return next.handle(); // boshqa holatlar uchun ham qaytarish
  }

  private stringify(context: ExecutionContext): string {
    return JSON.stringify(context).slice(0, 75); //req.bodyni objectdan jsonga ogirib oldik.0 dan 75 harfgacha kesib oldik
  }
}

//RestAPI request = HTTP REQUEST
//GraphQL request = GraphQl REQUEST