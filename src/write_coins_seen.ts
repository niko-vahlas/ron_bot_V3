import * as fs from 'fs/promises';

export async function appendToCoinsSeen(contractAddresses: Set<string>) {
  const filePath = '../contract_addresses_seen.json';

  try {
    let currentContent;
    try {
      currentContent = await fs.readFile(filePath, 'utf-8');
      currentContent = JSON.parse(currentContent);
    } catch {
      currentContent = { seenAddresses: [] };
    }

    const updatedAddresses = [
      ...new Set([...currentContent.seenAddresses, ...contractAddresses]),
    ];

    const toWrite = JSON.stringify(
      {
        seenAddresses: updatedAddresses,
      },
      null,
      2
    );

    await fs.writeFile(filePath, toWrite);

    console.log(`Updated contract addresses in ${filePath}`);
  } catch (error) {
    console.error('Error writing to file:', error);
  }
}
