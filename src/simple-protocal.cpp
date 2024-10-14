#ifndef __SimpleProtocolParser_H__
#define __SimpleProtocolParser_H__

#include <vector>
#include <cstdint>

class SimpleProtocolParser
{
public:
    SimpleProtocolParser()
    {
        reset();
    }

    // 编码器：将原始数据编码为符合协议格式的字节数组
    std::vector<uint8_t> encoder(const std::vector<uint8_t> &data)
    {
        std::vector<uint8_t> encodedData;

        // 添加帧头 0x55 0xAA
        encodedData.push_back(0x55);
        encodedData.push_back(0xAA);

        // 计算长度并添加 lengthH8 和 lengthL8
        uint16_t length = data.size();
        uint8_t lengthH8 = (length >> 8) & 0xFF; // 高位
        uint8_t lengthL8 = length & 0xFF;        // 低位
        encodedData.push_back(lengthH8);
        encodedData.push_back(lengthL8);

        // 添加原始数据
        for (const auto byte : data)
            encodedData.push_back(byte);

        // 计算并添加 CRC-8 校验码（仅对原始数据计算）
        uint8_t crc = crc_code(data);
        encodedData.push_back(crc);

        return encodedData;
    }

    // 解码器：逐字节解析数据
    std::vector<uint8_t> decoder(uint8_t byte)
    {
        switch (state)
        {
        case START:
            state = HEAD_1;
        case HEAD_1:
            if (byte == 0x55)
                state = HEAD_2;
            break;
        case HEAD_2:
            if (byte == 0xAA)
                state = LENGTH_H8;
            else
                reset();
            break;
        case LENGTH_H8:
            lengthH8 = byte;
            state = LENGTH_L8;
            break;
        case LENGTH_L8:
            lengthL8 = byte;
            length = (lengthH8 << 8) | lengthL8;
            state = DATA;
            break;
        case DATA:
            rawData.push_back(byte);
            if (rawData.size() == length)
                state = CRC;
            break;
        case CRC:
            if (crc_code(rawData) == byte)
            {
                std::vector<uint8_t> result = rawData;
                reset();
                return result;
            }
            else
            {
                reset(); // CRC 校验失败，重置
            }
            break;
        }
        return {}; // 未完成解码，返回 nullptr
    }

private:
    // 状态枚举
    enum State
    {
        START,
        HEAD_1,
        HEAD_2,
        LENGTH_H8,
        LENGTH_L8,
        DATA,
        CRC
    };

    State state;
    uint16_t length;
    std::vector<uint8_t> rawData;
    uint8_t lengthH8;
    uint8_t lengthL8;

    // 重置状态机
    void reset()
    {
        state = START;
        length = 0;
        rawData.clear();
    }

    // CRC-8 校验计算
    uint8_t crc_code(const std::vector<uint8_t> &data)
    {
        uint8_t crc = 0x00;
        for (const auto &byte : data)
        {
            crc ^= byte;
            for (int i = 0; i < 8; ++i)
            {
                if (crc & 0x80)
                    crc = (crc << 1) ^ 0x07;
                else
                    crc <<= 1;
                crc &= 0xFF; // 保证 CRC 结果在 8 位
            }
        }
        return crc;
    }
};

#endif