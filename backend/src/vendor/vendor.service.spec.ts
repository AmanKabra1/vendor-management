import { Test, TestingModule } from '@nestjs/testing';
import { VendorService } from './vendor.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { Repository } from 'typeorm';

describe('VendorService', () => {
  let service: VendorService;
  let repo: Repository<Vendor>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        {
          provide: getRepositoryToken(Vendor),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<VendorService>(VendorService);
    repo = module.get<Repository<Vendor>>(getRepositoryToken(Vendor));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
