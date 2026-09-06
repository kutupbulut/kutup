// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import i18n from '@/i18n'
import UploadPanel from './UploadPanel'

describe('UploadPanel', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('announces durable upload progress without occupying the workspace', () => {
    render(
      <UploadPanel
        state={{
          active: true,
          currentFile: 2,
          totalFiles: 4,
          filePercent: 50,
          overallPercent: 35,
          speedBps: 1024,
        }}
      />,
    )

    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Uploading file 2 of 4, 35% complete',
    )
    expect(screen.getByRole('progressbar', { name: 'Overall upload progress' })).toHaveAttribute(
      'aria-valuenow',
      '35',
    )
  })
})
