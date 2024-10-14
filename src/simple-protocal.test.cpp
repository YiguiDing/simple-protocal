#include "simple-protocal.cpp"
#include "iostream"
// g++  simple-protocal.test.cpp -o main.o
// ./main.o
int main()
{
    SimpleProtocolParser spp = SimpleProtocolParser();
    std::vector<uint8_t> data = spp.encoder({0x12, 0x34, 0x56, 0x55, 0xaa});
    for (const uint8_t byte : data)
        std::cout << std::hex << (uint16_t)byte << ',';
    std::cout << '\n';

    std::vector<uint8_t> raw;
    for (const uint8_t byte : data)
        raw = spp.decoder(byte);
    
    for (const uint8_t byte : raw)
        std::cout << std::hex << (uint16_t)byte << ',';
    std::cout << '\n';
}