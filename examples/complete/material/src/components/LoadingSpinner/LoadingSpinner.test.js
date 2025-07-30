import React from 'react'
import { createRoot } from 'react-dom/client'
import renderer from 'react-test-renderer'
import LoadingSpinner from './index'

it('renders without crashing', () => {
  const div = document.createElement('div')
  const root = createRoot(div)
  root.render(<LoadingSpinner />)
  root.unmount()
})

it('renders a spinner', () => {
  const tree = renderer.create(<LoadingSpinner />).toJSON()
  expect(tree).toMatchSnapshot()
})
