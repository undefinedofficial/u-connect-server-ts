# u-connect/server-ts

<img width="480px" src="https://raw.githubusercontent.com/undefinedofficial/u-connect-server-ts/main/u-connect-logo.jpg">

u-connect - это современная высокопроизводительная платформа удаленного вызова процедур (RPC) с открытым исходным кодом, написанная на TypeScript. Она позволяет эффективно создавать и подключать сервисы для обмена данными между ними с использованием бинарного протокола MessagePack.

## 📚 Содержание

- [Введение](#введение)
- [Установка](#установка)
- [Протоколы](#протоколы)
- [Декораторы](#декораторы)
- [Middleware](#middleware)
- [Transformer](#transformer)
- [Контекст вызова](#контекст-вызова-servercallcontext)
- [Примеры использования](#примеры-использования)
- [Обработка ошибок](#обработка-ошибок)
- [Отмена операций](#отмена-операций)
- [Построение сервера](#построение-сервера)

---

## Введение

u-connect/server-ts - это высокопроизводительная платформа RPC, которая позволяет создавать сервисы для обмена данными между процессами с использованием бинарного протокола MessagePack.

### 🎯 Когда использовать u-connect:

1. **Данные часто меняются и их нужно синхронизировать**
2. **Обмен данными в реальном времени с высокой скоростью**
3. **Много конечных точек где нужно отслеживать запрос с обоих сторон**
4. **Данные присылаются частично**
5. **Большое кол-во потоков данных**
6. **Подключение долго остается открытым**

---

## Установка

### Использование npm

```bash
npm install https://github.com/undefinedofficial/u-connect-server-ts.git
```

### Использование yarn

```bash
yarn add https://github.com/undefinedofficial/u-connect-server-ts.git
```

### Использование pnpm

```bash
pnpm install https://github.com/undefinedofficial/u-connect-server-ts.git
```

---

### Протоколы

u-connect использует бинарный протокол обмена данными **MessagePack**, который:

- Почти не уступает ProtoBuf в эффективности
- Заметно эффективнее JSON
- Идеален для данных, которые часто меняются
- Поддерживает частичную отправки данных

### Поддержка любого протокола

u-connect поддерживает использование любого протокола сериализации. Хотя по умолчанию используется MessagePack, вы можете легко подключить свои собственные протоколы или форматы данных наследуя `ISerializer`.

---

## Декораторы

### @Service

Декоратор для создания сервисов. Принимает:

- `name` - имя сервиса (по умолчанию имя класса)

```typescript
import { Service } from "../core";

@Service(/* name (Необязательно) */ "HelloService")
class HelloService {
  constructor(arg1: string, arg2: number) {
    console.log("Created HelloService", arg1, arg2);
  }

  // Методы сервиса...
}
```

### @UnaryMethod

Декоратор для синхронного (Запрос->Ответ) метода. Принимает:

- `name` - имя метода (по умолчанию имя метода)

```typescript
import { UnaryMethod, ServerCallContext } from "../core";

@UnaryMethod()
public async hello(
  request: HelloRequest,
  context: ServerCallContext
): Promise<HelloResponse> {
  return { message: `Hello ${request.name}` };
}
```

### @ServerStreamMethod

Декоратор для серверного потокового вывода. Принимает:

- `name` - имя метода (по умолчанию имя метода)

```typescript
import { ServerStreamMethod, ServerCallContext, type IServerStreamWriter } from "../core";

@ServerStreamMethod()
public async streamHello(
  request: HelloRequest,
  writer: IServerStreamWriter<HelloResponse>,
  context: ServerCallContext
) {
  for (let i = 0; i < 10; i++) {
    await writer.Write({ message: `Hello ${request.name}!` });
    await sleep(1000);
  }
}
```

### @ClientStreamMethod

Декоратор для клиентского потокового ввода. Принимает:

- `name` - имя метода (по умолчанию имя метода)

```typescript
import { ClientStreamMethod, ServerCallContext, type IClientStreamReader } from "../core";

@ClientStreamMethod()
public async clientStreamHello(
  reader: IClientStreamReader<HelloRequest>,
  context: ServerCallContext
) {
  const messages: HelloRequest[] = [];

  while (await reader.MoveNext()) {
    messages.push(reader.Current);
  }

  return { message: `Processed ${messages.length} messages` };
}
```

### @DuplexStreamMethod

Декоратор для двустороннего потокового метода. Принимает:

- `name` - имя метода (по умолчанию имя метода)

```typescript
import { DuplexStreamMethod, ServerCallContext, type IServerStreamWriter, type IClientStreamReader } from "../core";

@DuplexStreamMethod()
public async duplexHello(
  reader: IClientStreamReader<HelloRequest>,
  writer: IServerStreamWriter<HelloResponse>,
  context: ServerCallContext
) {
  while (await reader.MoveNext()) {
    await writer.Write({ message: `Echo: ${reader.Current}` });
  }
}
```

---

## Middleware

### Middleware для сервиса

Создание middleware для всего сервиса.

```typescript
import { Middleware } from "../core";

@Service()
@Middleware((ctx, next) => {
  console.log(`Service middleware`, ctx.Method);
  return next();
})
class HelloService {
  constructor(arg1: string, arg2: number) {
    console.log("Created HelloService", arg1, arg2);
  }

  @UnaryMethod("hello")
  public async hello(
    request: HelloRequest,
    context: ServerCallContext
  ): Promise<HelloResponse> {
    return { message: `Hello, ${request.name}!` };
  }
}
```

### Middleware для метода

Создание middleware для конкретного метода.

```typescript
import { Middleware } from "../core";

@UnaryMethod("hello")
@Middleware((ctx, next) => {
  console.log(`Method middleware: ${ctx.Method}`);
  return next();
})
public async hello(
  request: HelloRequest,
  context: ServerCallContext
): Promise<HelloResponse> {
  return { message: `Hello, ${request.name}!` };
}
```

### Transformer

Используется для мутации запроса и валидации данных перед обработкой метода. Он предназначен для преобразования входящих данных из одного формата в другой (например, из JSON строки в объект) или для валидации запроса перед его обработкой.

- Может быть указан только **один раз** на методе (не следует использовать несколько @Transformer)
- Для методов типа **UnaryMethod** и **ServerStreamMethod** вызывается **один раз** на весь вызов метода
- Для методов типа **ClientStreamMethod** и **DuplexStreamMethod** вызывается **каждый раз** при приеме данных от клиента
- Принимает функцию-трансформер, которая должна возвращать преобразованные данные

```typescript
import { Transformer } from "../core";

@UnaryMethod("hello")
@Transformer((data) => {
  return data;
})
public async hello(
  request: HelloRequest,
  context: ServerCallContext
): Promise<HelloResponse> {

  return { message: `Hello, ${request.name}!` };
}
```

---

## Контекст вызова (ServerCallContext)

Контекст вызова предоставляет информацию о текущем методе и возможность управлять вызовом.

```typescript
import { ServerCallContext } from "../core";

@UnaryMethod("hello")
public async hello(
  request: HelloRequest,
  context: ServerCallContext
): Promise<HelloResponse> {
  // Доступ к свойствам контекста
  const callId = context.Id;           // ID вызова (Readonly)
  const methodName = context.Method.name; // Имя метода (Readonly)
  const deadline = context.Deadline;    // Срок годности вызова (Readonly)
  const requestMeta = context.RequestMeta; // Метаданные запроса (Readonly)
  const responseMeta = context.ResponseMeta; // Метаданные ответа
  const status = context.Status;         // Текущий статус
  const userState = context.GetUserState(); // Пользовательское состояние

  return { message: "OK" };
}
```

---

## Примеры использования

### Полный пример сервера

```typescript
import {
  Service,
  UnaryMethod,
  ServerStreamMethod,
  ClientStreamMethod,
  DuplexStreamMethod,
  ServerCallContext,
  type IServerStreamWriter,
  type IClientStreamReader,
  Middleware,
} from "../core";

import { MsgPackSerializer } from "../serializer/MsgPackSerializer";
import { uWebSocketsTransport } from "../transport/uWebSocketsTransport";

// Определение типов запроса и ответа
interface HelloRequest {
  name: string;
  message: string;
}

interface HelloResponse {
  message: string;
  timestamp?: number;
}

// Создание сервиса
@Service()
class HelloService {
  constructor(name: string) {
    console.log(`HelloService initialized with: ${name}`);
  }

  @UnaryMethod("hello")
  public async hello(
    request: HelloRequest,
    context: ServerCallContext
  ): Promise<HelloResponse> {
    console.log(`Unary: ${request.name}`);
    return { message: `Hello, ${request.name}!` };
  }

  @ServerStreamMethod("streamHello")
  public async streamHello(
    request: HelloRequest,
    writer: IServerStreamWriter<HelloResponse>,
    context: ServerCallContext
  ) {
    console.log(`Server Stream: ${request.name}`);

    for (let i = 0; i < 5; i++) {
      await writer.write({
        message: `Stream message ${i + 1}`,
        timestamp: Date.now(),
      });
      await sleep(1000);
    }
  }

  @ClientStreamMethod("processMessages")
  public async processMessages(
    reader: IClientStreamReader<HelloRequest>,
    context: ServerCallContext
  ): Promise<HelloResponse> {
    console.log(`Client Stream: Processing messages`);

    const messages: HelloRequest[] = [];
    while (await reader.MoveNext(null)) {
      messages.push(reader.Current);
    }

    return {
      message: `Processed ${messages.length} messages`,
    };
  }

  @DuplexStreamMethod("echo")
  public async echo(
    reader: IClientStreamReader<HelloRequest>,
    writer: IServerStreamWriter<HelloResponse>,
    context: ServerCallContext
  ) {
    console.log(`Duplex Stream: Echo started`);

    while (await reader.MoveNext()) {
      await writer.write({
        message: `Echo: ${reader.Current}`,
      });
    }
  }
}

const app = new Builder()
  .withTransport(new uWebSocketsTransport("/api/ws"))
  .withSerializer(new MsgPackSerializer())
  .addService(HelloService, /* name arg */ "Test")
  .build();

// Запуск сервера
await app.listen(3000);
```

---

## Обработка ошибок

### Status

Использование статусов для обработки ошибок.

```typescript
import { Status } from "../core";

@UnaryMethod("hello")
@Middleware((ctx, next) => {
  // Проверка авторизации
  if (!ctx.RequestMeta.authorization) {
    throw new MethodError(Status.UNAUTHENTICATED, "Unauthorized");
  }

  return next();
})
@Transformer((data)=> {
  if (!data.name) {
    throw new MethodError(Status.INVALID_ARGUMENT, "Name is required");
  }
  return data;
})
public async hello(
  request: HelloRequest,
  context: ServerCallContext
): Promise<HelloResponse> {

  context.Status = Status.UNKNOWN; // success response with UNKNOWN status

  return { message: `Hello, ${request.name}!` };
}
```

## Отмена операций

### CancellationToken

Управление временем жизни вызова и отмены операций.

При обработке запросов `context` предоставляет `CancellationToken` в контексте вызова, который позволяет обнаруживать## - Построение серверасторон.

#### Обработка отмены.

```typescript
@UnaryMethod("process")
public async process(
  request: ProcessRequest,
  context: ServerCallContext
): Promise<ProcessResponse> {


  context.CancellationToken.Register(() => {

  });

  context.CancellationToken.IsCancellationRequested;

  await context.CancellationToken.CancellationPromise; // запрос не завершится пока клиент его не отменит.
}
```

---

## Построение сервера

```typescript
import { UConnectServer } from "../core";

const app = new Builder()
  .withTransport(new uWebSocketsTransport("/api/ws"))
  .withSerializer(new MsgPackSerializer())
  .addService(HelloService, /* name arg */ "Test")
  .build();

// Запуск сервера
await app.listen(3000);
```

---

Copyright (c) 2024 https://github.com/undefinedofficial
Released under the MIT license
