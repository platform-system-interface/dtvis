import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { DataNode } from './DTNode';

const meta = {
  title: 'App/DTNode',
  component: DataNode,
  argTypes: {
    data: {
      label: { control: 'text' },
      baseAddr: {},
      compat: {},
    },
    status: { control: 'radio', options: ['okay', 'disabled', undefined] },
  },
} satisfies Meta<typeof DataNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    data: {
      label: "UART",
      baseAddr: "0x0c00_0000",
      compat: "ns16550a",
    },
    status: "okay",
  },
};

export const WithCompat: Story = {
  args: {
    data: {
      label: "firmware",
      compat: "raspberrypi,bcm2835-firmware",
    },
  },
};
