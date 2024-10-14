export class SimpleProtocalParser {
  // 定义状态枚举
  private STATES = Object.freeze({
    START: 0, // 初始状态
    HEAD_1: 1, // 接收 0x55
    HEAD_2: 2, // 接收 0xAA
    LENGTH_H8: 3, // 接收长度高位
    LENGTH_L8: 4, // 接收长度低位
    DATA: 5, // 接收数据
    CRC: 6, // 接收 CRC 校验字节
  });

  private state!: number;
  private length!: number;
  private rawData!: number[];
  private lengthH8!: number;
  private lengthL8!: number;

  constructor() {
    this.reset();
  }

  // 重置状态机
  private reset(): void {
    this.state = this.STATES.START; // 初始状态
    this.length = 0; // 数据长度
    this.rawData = []; // 解码出的原始数据
  }

  // 编码器：将原始数据编码为符合协议格式的字节数组
  public encoder(data: number[] | Buffer): number[] {
    let encodedData: number[] = [];

    // 添加帧头 0x55 0xAA
    encodedData.push(0x55, 0xaa);

    // 计算长度并添加 lengthH8 和 lengthL8
    let length = data.length;
    let lengthH8 = (length >> 8) & 0xff; // 高位
    let lengthL8 = length & 0xff; // 低位
    encodedData.push(lengthH8, lengthL8);

    // 添加原始数据
    for (let byte of data) {
      encodedData.push(byte);
    }

    // 计算并添加 CRC-8 校验码（从帧头开始）
    let crc = this.crc_code(encodedData);
    encodedData.push(crc);
    return encodedData;
  }

  // 解码器：逐字节解析数据
  public decoder(byte: number): number[] | null {
    switch (this.state) {
      case this.STATES.START:
        this.state = this.STATES.HEAD_1;
        // break;
      case this.STATES.HEAD_1:
        if (byte === 0x55) {
          this.state = this.STATES.HEAD_2;
        }
        break;
      case this.STATES.HEAD_2:
        if (byte === 0xaa) {
          this.state = this.STATES.LENGTH_H8;
        } else {
          this.reset(); // 帧头不匹配，重置
        }
        break;
      case this.STATES.LENGTH_H8:
        this.lengthH8 = byte;
        this.state = this.STATES.LENGTH_L8;
        break;
      case this.STATES.LENGTH_L8:
        this.lengthL8 = byte;
        this.length = (this.lengthH8 << 8) | this.lengthL8;
        this.state = this.STATES.DATA;
        break;
      case this.STATES.DATA:
        this.rawData.push(byte);
        // 如果原始数据长度等于定义的长度，则切换到 CRC 校验状态
        if (this.rawData.length === this.length) {
          this.state = this.STATES.CRC;
        }
        break;
      case this.STATES.CRC:
        let crc = this.crc_code([
          0x55,
          0xaa,
          this.lengthH8,
          this.lengthL8,
          ...this.rawData,
        ]);
        if (crc === byte) {
          let result = this.rawData.slice(); // 返回解码的原始数据
          this.reset(); // 解码完成，重置状态
          return result;
        } else {
          this.reset(); // CRC 校验失败，重置
        }
        break;
    }
    return null; // 未完成解码，返回 null
  }

  // CRC-8 校验计算
  private crc_code(data: number[]): number {
    let crc = 0x00;
    for (let byte of data) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x80) crc = (crc << 1) ^ 0x07;
        else crc = crc << 1;
        crc &= 0xff; // 保证 CRC 结果在 8 位
      }
    }
    return crc;
  }
}
