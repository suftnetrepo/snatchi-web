import React from 'react'
import { Container } from 'react-bootstrap'

export default function Footer() {
  return (
    <footer className="footer border-top px-sm-2 py-2">
      <Container fluid className=" align-items-center flex-md-row d-flex justify-content-between">
        <div>
          <a className="text-decoration-none" href="https://suftnet.com">
           Suftnet Limited
          </a>
          {' '}
          © 2024
      
        </div>
       
      </Container>
    </footer>
  )
}
