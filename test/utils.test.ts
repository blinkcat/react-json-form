import { IField } from '../lib';
import { convert2InternalFields } from '../lib/utils';

test('convert2InternalField should work well', () => {
  const source: IField = {
    group: [
      {
        name: 'a',
        group: [
          {
            name: 'b',
            type: 'input',
          },
          {
            type: 'input',
          },
        ],
      },
    ],
  };

  const res = convert2InternalFields([source], '', '').map((item) => ({
    key: item.key,
    parentKey: item.parentKey,
    actualName: item.actualName,
  }));

  expect(res).toEqual([
    { key: '0', parentKey: '', actualName: undefined },
    { key: '0_a', parentKey: '0', actualName: 'a' },
    { key: '0_a_b', parentKey: '0_a', actualName: 'a.b' },
    { key: '0_a_1', parentKey: '0_a', actualName: undefined },
  ]);
});
