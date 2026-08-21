import React from 'react'
import { Container } from 'react-bootstrap'
import { siteIdentity } from '@/data/site'

export default function Footer() {
  return (
    <footer className="footer border-top px-sm-2 py-2">
      <Container fluid className=" align-items-center flex-md-row d-flex justify-content-between">
        <div>
          {siteIdentity.productName} administration · {siteIdentity.ownerName} © {new Date().getFullYear()}
      
        </div>
       
      </Container>
    </footer>
  )
}
